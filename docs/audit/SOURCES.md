# Audit Areas & Authoritative Sources

This document is the human-readable companion to `scripts/lib/areas.mjs`. It
defines the distinct **areas** the audit framework evaluates, the authoritative
government source for each, and the rule used to classify a profile as
**verified** vs **unverified**.

## Verification rule

A person's profile is **verified** when their primary contact info (the office
`website`) is served from an official government domain (`*.gov`, e.g.
`azleg.gov`, `*.house.gov`, `*.senate.gov`, a county or city `.gov`). Campaign
sites, scraped pages, and unconfirmed/manual entries are **unverified**. An
absent `verification` field is treated as unverified by the UI.

The audit script computes this status and reports it; it does **not** write it
into the data files (that is a reviewed follow-up "write-pass").

## Areas

| Area key | What it covers | Authoritative source | Official domains |
|---|---|---|---|
| `state-senate` | 30 state senators (1/district) | azleg.gov member roster | azleg.gov, az.gov, azsos.gov |
| `state-house` | 60 state representatives (2/district) | azleg.gov member roster | azleg.gov, az.gov, azsos.gov |
| `executive` | Governor, Sec. of State, AG, Treasurer, Superintendent | agency `.gov` sites | az.gov, azsos.gov, azag.gov, aztreasury.gov, azed.gov, azgovernor.gov |
| `us-house` | Arizona's 9 U.S. House members | house.gov / congress.gov | house.gov, congress.gov |
| `us-senate` | Arizona's 2 U.S. Senators | senate.gov / congress.gov | senate.gov, congress.gov |
| `county` | County boards of supervisors | each county `.gov` board page | `.gov` |
| `city` | City mayors + council members | each municipal `.gov` council page | `.gov` |
| `committees` | Senate + House standing committees | azleg.gov committee pages, Ballotpedia | azleg.gov |

## Known gaps (as of this writing)

- **`us-senate` is not yet in the dataset.** `federal-mapping.json` contains only
  U.S. House members. Arizona's 2 U.S. Senators must be added. The audit reports
  this as a `missing-area` gap (expected 2, found 0).
- **Committee membership** is matched to legislators by display name. Nicknames
  and suffixes can cause fuzzy mismatches; the audit reports unmatched names with
  nearest candidates rather than auto-correcting them.

## Data policy

Follow `CLAUDE.md`'s Privacy and Data Collection Policy: only include accounts
and contact info from official/public sources. When uncertain, exclude rather
than guess.
