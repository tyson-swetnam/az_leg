---
description: Audit a single area of the dataset (pass an area key, e.g. /audit-area state-senate). Report-only.
argument-hint: <area-key>
---

Audit one area of the Arizona Legislature dataset.

Area key: **$ARGUMENTS**
(valid keys: `state-senate`, `state-house`, `executive`, `us-house`,
`us-senate`, `county`, `city`, `committees` — see `scripts/lib/areas.mjs`.)

Launch the `data-area-auditor` sub-agent for this area. Tell it to:
1. Cross-check the roster against the authoritative `.gov` source.
2. Verify each person has an office/address plus official(verified) or
   unofficial(unverified) social media.
3. Run `node scripts/audit-data.mjs --area=$ARGUMENTS --skip-http` for hard
   numbers (add a full HTTP run only if link status is needed).

Then relay its findings. Do not edit any data files — propose changes for review.
