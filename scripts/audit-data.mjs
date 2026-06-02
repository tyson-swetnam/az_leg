#!/usr/bin/env node

/**
 * Unified data audit for the Arizona Legislature app.
 *
 * Enumerates every person across all distinct areas (state senate, state house,
 * executive, U.S. House, U.S. Senate, county supervisors, city councils, and
 * committee rosters) and reports:
 *
 *   (a) Link check    — HTTP status for every URL (office, campaign, social).
 *   (b) Completeness   — does each person have an office/address AND social media
 *                        (official=verified or unofficial=unverified)?
 *   (c) Verification   — verified vs unverified breakdown (verified == primary
 *                        contact info served from an official *.gov domain).
 *   (d) Gaps           — missing areas (e.g. U.S. Senate), committee members not
 *                        matched to a legislator, and federal mapping integrity.
 *
 * This is a REPORT-ONLY tool: it never edits the data files. It always exits 0
 * so it can run in CI without failing the build.
 *
 * Usage:
 *   npm run audit                    # full run incl. HTTP link checks
 *   npm run audit:fast               # skip HTTP (instant; completeness + gaps)
 *   node scripts/audit-data.mjs --area=state-senate   # scope to one area
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { checkUrls, classifyDomain, INCONCLUSIVE_STATUS_CODES } from './lib/url-check.js';
import { AREAS, AREA_KEYS } from './lib/areas.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const args = process.argv.slice(2);
const skipHttp = args.includes('--skip-http');
const areaArg = (args.find((a) => a.startsWith('--area=')) || '').split('=')[1] || null;

const SOCIAL_PLATFORMS = ['twitter', 'facebook', 'instagram', 'linkedin', 'bluesky'];
const URL_SENTINELS = new Set(['no website found', 'tbd', 'n/a', '']);

const sep = '='.repeat(60);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadJson(relPath) {
  return JSON.parse(readFileSync(join(ROOT, relPath), 'utf-8'));
}

function isCheckableUrl(u) {
  return typeof u === 'string' && /^https?:\/\//i.test(u.trim()) && !URL_SENTINELS.has(u.trim().toLowerCase());
}

function countAccounts(accounts) {
  if (!accounts || typeof accounts !== 'object') return 0;
  return Object.values(accounts).filter((v) => isCheckableUrl(v)).length;
}

/** Normalize a person name for fuzzy matching (drop nicknames, suffixes, punctuation). */
function normalizeName(name) {
  return String(name)
    .toLowerCase()
    .replace(/"[^"]*"/g, ' ') // remove "Mitzi" style nicknames
    .replace(/[.,]/g, ' ')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function nameTokens(name) {
  const n = normalizeName(name).split(' ').filter(Boolean);
  return { first: n[0] || '', last: n[n.length - 1] || '', full: n.join(' ') };
}

// ---------------------------------------------------------------------------
// Enumeration — one normalized record per person, tagged by area
// ---------------------------------------------------------------------------

function makePerson({ area, name, party, scope, office, official, personal }) {
  const urls = [];
  const push = (field, u) => {
    if (isCheckableUrl(u)) urls.push({ field, url: u.trim() });
  };

  const website = office?.website ?? null;
  push('office.website', website);
  push('campaignWebsite', office?.campaignWebsite);
  push('campaignFinance.azsos', office?.azsos_url);
  push('campaignFinance.ftm', office?.followthemoney_url);
  for (const p of SOCIAL_PLATFORMS) {
    push(`official.${p}`, official?.[p]);
    push(`personal.${p}`, personal?.[p]);
  }

  const hasOffice = isCheckableUrl(website) || !!office?.phone || !!office?.email || !!office?.address;
  const hasOfficialSocial = countAccounts(official) > 0;
  const hasUnofficialSocial = countAccounts(personal) > 0;
  const verifiedStatus = classifyDomain(website || '').isGov ? 'verified' : 'unverified';

  return {
    area,
    name,
    party: party ?? null,
    scope,
    hasOffice,
    hasOfficialSocial,
    hasUnofficialSocial,
    complete: hasOffice && (hasOfficialSocial || hasUnofficialSocial),
    verifiedStatus,
    urls,
  };
}

function enumeratePeople(data) {
  const people = [];

  // State senate, house, executive (legislators.json)
  for (const d of data.legislators.districts) {
    if (d.senator) {
      people.push(makePerson({
        area: 'state-senate', name: d.senator.name, party: d.senator.party,
        scope: `District ${d.id}`, office: { ...d.senator.office, campaignWebsite: d.senator.campaignWebsite },
        official: d.senator.socialMedia?.official, personal: d.senator.socialMedia?.personal,
      }));
    }
    for (const rep of d.representatives || []) {
      people.push(makePerson({
        area: 'state-house', name: rep.name, party: rep.party,
        scope: `District ${d.id}`, office: { ...rep.office, campaignWebsite: rep.campaignWebsite },
        official: rep.socialMedia?.official, personal: rep.socialMedia?.personal,
      }));
    }
  }
  for (const exec of data.legislators.executive || []) {
    people.push(makePerson({
      area: 'executive', name: exec.name, party: exec.party, scope: exec.title,
      office: exec.office, official: exec.socialMedia?.official, personal: exec.socialMedia?.personal,
    }));
  }

  // U.S. House (federal-mapping.json)
  for (const m of data.federal.congressMembers || []) {
    people.push(makePerson({
      area: 'us-house', name: m.name, party: m.party, scope: `CD-${m.district}`,
      office: m.office, official: m.socialMedia?.official, personal: m.socialMedia?.personal,
    }));
  }
  // U.S. Senate — accept either `senators` or `usSenate` key if it ever exists
  for (const s of data.federal.senators || data.federal.usSenate || []) {
    people.push(makePerson({
      area: 'us-senate', name: s.name, party: s.party, scope: 'U.S. Senate',
      office: s.office, official: s.socialMedia?.official, personal: s.socialMedia?.personal,
    }));
  }

  // Local officials (local-officials.json) — flat socialMedia (treated as unofficial)
  const localPerson = (o, area, scope) => makePerson({
    area, name: o.name, party: o.party, scope,
    office: {
      website: o.website, phone: o.phone, email: o.email,
      campaignWebsite: o.campaignWebsite,
      azsos_url: o.campaignFinance?.azsos_url, followthemoney_url: o.campaignFinance?.followthemoney_url,
    },
    official: undefined,
    personal: o.socialMedia,
  });
  for (const [slug, county] of Object.entries(data.local.counties || {})) {
    for (const sup of county.supervisors || []) {
      people.push(localPerson(sup, 'county', `${county.name || slug} D${sup.district ?? '?'}`));
    }
  }
  for (const [slug, city] of Object.entries(data.local.cities || {})) {
    if (city.mayor) people.push(localPerson(city.mayor, 'city', `${city.name || slug} Mayor`));
    for (const m of city.members || []) {
      const seat = m.ward ? `Ward ${m.ward}` : m.district ? `District ${m.district}` : 'At-large';
      people.push(localPerson(m, 'city', `${city.name || slug} ${seat}`));
    }
  }

  return people;
}

// ---------------------------------------------------------------------------
// Gap detection
// ---------------------------------------------------------------------------

function detectGaps(data, people) {
  const gaps = [];

  // (1) Missing areas — compare per-area headcount against expected.
  for (const area of AREAS) {
    if (area.expected == null) continue;
    const found = people.filter((p) => p.area === area.key).length;
    if (found < area.expected) {
      gaps.push({
        kind: 'missing-area',
        area: area.key,
        expected: area.expected,
        found,
        note: area.note,
      });
    }
  }

  // (2) Committee members not matched to a legislator.
  const legislatorNames = [];
  for (const d of data.legislators.districts) {
    if (d.senator) legislatorNames.push(d.senator.name);
    for (const r of d.representatives || []) legislatorNames.push(r.name);
  }
  const normIndex = new Map(); // normalized full -> original
  const lastIndex = new Map(); // normalized last -> [original]
  for (const n of legislatorNames) {
    const t = nameTokens(n);
    normIndex.set(t.full, n);
    if (!lastIndex.has(t.last)) lastIndex.set(t.last, []);
    lastIndex.get(t.last).push(n);
  }
  const matchLegislator = (raw) => {
    const t = nameTokens(raw);
    if (normIndex.has(t.full)) return { matched: true };
    // first+last token match against any legislator
    for (const n of legislatorNames) {
      const lt = nameTokens(n);
      if (lt.first === t.first && lt.last === t.last) return { matched: true };
    }
    const candidates = lastIndex.get(t.last) || [];
    return { matched: false, candidates };
  };

  const seenUnmatched = new Set();
  for (const chamber of ['senate', 'house']) {
    for (const c of data.committees[chamber] || []) {
      const roster = [c.chair, c.viceChair, ...(c.members || [])].filter(Boolean);
      for (const member of roster) {
        const res = matchLegislator(member);
        if (!res.matched) {
          const key = `${chamber}:${member}`;
          if (seenUnmatched.has(key)) continue;
          seenUnmatched.add(key);
          gaps.push({
            kind: 'unmatched-committee-member',
            chamber,
            committee: c.shortName || c.name,
            name: member,
            nearestCandidates: res.candidates,
          });
        }
      }
    }
  }

  // (3) Federal mapping integrity — every stateToFederal value must reference an
  // existing congressional member district.
  const cdSet = new Set((data.federal.congressMembers || []).map((m) => m.district));
  for (const [stateDist, cd] of Object.entries(data.federal.stateToFederal || {})) {
    if (!cdSet.has(cd)) {
      gaps.push({
        kind: 'federal-mapping-orphan',
        stateDistrict: Number(stateDist),
        mappedTo: cd,
        note: `State district ${stateDist} maps to CD-${cd}, which has no congressMember entry.`,
      });
    }
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('🔍 Arizona Legislature — Unified Data Audit\n');
  if (skipHttp) console.log('⚡ FAST MODE: skipping HTTP link checks\n');
  if (areaArg) console.log(`🎯 Scoped to area: ${areaArg}\n`);

  const data = {
    legislators: loadJson('src/data/legislators.json'),
    federal: loadJson('src/data/federal-mapping.json'),
    local: loadJson('src/data/local-officials.json'),
    committees: loadJson('src/data/committees.json'),
  };

  let people = enumeratePeople(data);
  if (areaArg) {
    if (!AREA_KEYS.includes(areaArg)) {
      console.error(`❌ Unknown area "${areaArg}". Valid: ${AREA_KEYS.join(', ')}`);
      process.exit(0);
    }
    people = people.filter((p) => p.area === areaArg);
  }

  const report = {
    timestamp: new Date().toISOString(),
    scopedArea: areaArg,
    areas: {},
    overall: { totalPeople: people.length, complete: 0, incomplete: 0, verified: 0, unverified: 0 },
    links: { skipped: skipHttp, checked: 0, ok: 0, broken: [], inconclusive: [] },
    gaps: [],
  };

  // ---- (c) + (b) per-area completeness & verification breakdown ----
  console.log(sep);
  console.log('📊 Completeness & Verification by Area');
  console.log(sep + '\n');

  for (const key of areaArg ? [areaArg] : AREA_KEYS) {
    const inArea = people.filter((p) => p.area === key);
    const complete = inArea.filter((p) => p.complete);
    const incomplete = inArea.filter((p) => !p.complete);
    const verified = inArea.filter((p) => p.verifiedStatus === 'verified');
    const label = (AREAS.find((a) => a.key === key) || {}).label || key;

    report.areas[key] = {
      label,
      total: inArea.length,
      complete: complete.length,
      verified: verified.length,
      unverified: inArea.length - verified.length,
      incomplete: incomplete.map((p) => ({
        name: p.name, scope: p.scope,
        missing: [
          !p.hasOffice && 'office/address',
          !(p.hasOfficialSocial || p.hasUnofficialSocial) && 'social media',
        ].filter(Boolean),
      })),
    };

    report.overall.complete += complete.length;
    report.overall.incomplete += incomplete.length;
    report.overall.verified += verified.length;
    report.overall.unverified += inArea.length - verified.length;

    console.log(`▸ ${label} (${inArea.length})`);
    console.log(`    complete: ${complete.length}/${inArea.length}   verified: ${verified.length}/${inArea.length}`);
    if (incomplete.length > 0) {
      for (const p of incomplete) {
        console.log(`    ⚠️  ${p.name} (${p.scope}) — missing: ${report.areas[key].incomplete.find((x) => x.name === p.name).missing.join(', ')}`);
      }
    }
    console.log('');
  }

  // ---- (d) gaps ----
  console.log(sep);
  console.log('🧩 Gaps');
  console.log(sep + '\n');
  report.gaps = detectGaps(data, people);
  if (areaArg) report.gaps = report.gaps.filter((g) => !g.area || g.area === areaArg);
  if (report.gaps.length === 0) {
    console.log('   ✓ No gaps detected\n');
  } else {
    for (const g of report.gaps) {
      if (g.kind === 'missing-area') {
        console.log(`   ❗ MISSING ${g.area}: found ${g.found}/${g.expected}. ${g.note}`);
      } else if (g.kind === 'unmatched-committee-member') {
        const hint = g.nearestCandidates?.length ? ` (did you mean: ${g.nearestCandidates.join(', ')}?)` : '';
        console.log(`   ⚠️  Committee ${g.chamber}/${g.committee}: "${g.name}" not matched to a legislator${hint}`);
      } else if (g.kind === 'federal-mapping-orphan') {
        console.log(`   ⚠️  ${g.note}`);
      }
    }
    console.log('');
  }

  // ---- (a) link check ----
  console.log(sep);
  console.log('🌐 Link Check');
  console.log(sep + '\n');

  // Deduplicate URLs globally; remember every owner of each URL.
  const urlOwners = new Map(); // url -> [{ name, area, field }]
  for (const p of people) {
    for (const { field, url } of p.urls) {
      if (!urlOwners.has(url)) urlOwners.set(url, []);
      urlOwners.get(url).push({ name: p.name, area: p.area, field });
    }
  }
  const uniqueUrls = [...urlOwners.keys()];
  console.log(`   ${uniqueUrls.length} unique URLs across ${people.length} people\n`);

  if (skipHttp) {
    console.log('   ⏭️  Skipped (--skip-http)\n');
  } else {
    const results = await checkUrls(
      uniqueUrls.map((url) => ({ url })),
      {
        onProgress: (i, total, item, result) => {
          const status = result.accessible ? `OK ${result.status}` : `${result.error}${result.status ? ` (${result.status})` : ''}`;
          const icon = result.accessible ? '✓' : result.inconclusive ? '∼' : '✗';
          console.log(`   [${i + 1}/${total}] ${icon} ${status}  ${item.url}`);
        },
      },
    );
    report.links.checked = results.length;
    for (const r of results) {
      const owners = urlOwners.get(r.url);
      if (r.accessible) {
        report.links.ok++;
      } else if (r.inconclusive || INCONCLUSIVE_STATUS_CODES.includes(r.status)) {
        report.links.inconclusive.push({ url: r.url, status: r.status, error: r.error, owners });
      } else {
        report.links.broken.push({ url: r.url, status: r.status, error: r.error, owners });
      }
    }
    console.log('');
  }

  // ---- summary ----
  console.log(sep);
  console.log('📈 SUMMARY');
  console.log(sep + '\n');
  console.log(`People audited:      ${report.overall.totalPeople}`);
  console.log(`Complete profiles:   ${report.overall.complete}/${report.overall.totalPeople}`);
  console.log(`Verified (official): ${report.overall.verified}/${report.overall.totalPeople}`);
  console.log(`Unverified:          ${report.overall.unverified}/${report.overall.totalPeople}`);
  console.log(`Gaps:                ${report.gaps.length}`);
  if (!skipHttp) {
    console.log(`Links checked:       ${report.links.checked}  (ok ${report.links.ok}, broken ${report.links.broken.length}, inconclusive ${report.links.inconclusive.length})`);
  }
  console.log('');

  const outPath = join(ROOT, 'audit-report.json');
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(`📁 Report written to ${outPath}\n`);

  process.exit(0);
}

main().catch((err) => {
  // Never fail the build — report the error and exit 0.
  console.error('❌ Audit error:', err.message);
  if (existsSync(join(ROOT, 'audit-report.json'))) {
    console.error('   (a previous audit-report.json is preserved)');
  }
  process.exit(0);
});
