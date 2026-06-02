---
description: Orchestrate a full data-quality audit across every area (state senate/house, executive, US House/Senate, counties, cities, committees) plus link + UI inspection, then write a consolidated dated report. Report-only — does not edit data.
---

Run a complete, parallelized audit of the Arizona Legislature dataset. This is a
**report-only** workflow: do not edit any data files.

## Steps

1. **Fan out per area.** Launch the `data-area-auditor` sub-agent **in parallel**
   (one Task call per area, all in a single message) for each area key in
   `scripts/lib/areas.mjs`:
   `state-senate`, `state-house`, `executive`, `us-house`, `us-senate`,
   `county`, `city`, `committees`.
   Give each agent its area key and tell it to cross-check the roster against the
   authoritative source and report completeness + provenance.

2. **Link + UI inspection.** In parallel with (or after) the area agents:
   - Launch `link-auditor` to run `npm run audit` and summarize broken vs.
     inconclusive URLs.
   - Launch `ui-inspector` to run `npm run test:e2e` and report rendering health.

3. **Consolidate.** Merge every sub-agent's findings into a single markdown
   report at `docs/audits/<YYYY-MM-DD>.md` containing:
   - Per-area roster discrepancies (with source URLs).
   - People with incomplete profiles (missing office/address and/or social media).
   - Verified vs. unverified breakdown, overall and per area.
   - Broken links (excluding inconclusive/bot-blocked).
   - Known gaps (e.g. missing U.S. Senate, unmatched committee members).
   - A prioritized "recommended fixes" list for a follow-up write-pass.

4. **Summarize** the top findings back to the user. Do NOT modify
   `legislators.json`, `local-officials.json`, `committees.json`, or
   `federal-mapping.json` — propose changes for review instead.

$ARGUMENTS
