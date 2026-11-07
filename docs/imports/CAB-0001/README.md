# CAB-0001 — Anwar Ibrahim and Ahmad Zahid Hamidi

Researched 8 November 2026. Two existing public editorial profiles, two official portraits and four milestones. Public office, party and constituency links were rechecked. Existing UUIDs, votes, party relationships and unclaimed ownership are preserved. No accounts are created.

`manifest.json` is the source and assessment register. `import.sql` is a scoped, transactional, repeatable import keyed by batch/person/promise; rerunning updates content without duplicating rows or replacing their vote identities. `before.json` captures the public records before import. Apply the additive migration first, deploy the matching UI second, then import content. Do not run the destructive clean-install `supabase/setup.sql` on an existing database.

## Evidence decisions

- Anwar: RM1,700 minimum-wage rate — achieved means the legal rate took effect in phases, not that every employer complies. Budget 2025 paragraphs 191–192 are the promise source; Sarawak Labour Department FAQ is implementation evidence, with no publication date shown.
- Anwar: BUDI95 — achieved means programme introduction, supported by MOF reporting actual September 2025 use. No claim about current price or overall fiscal impact.
- Ahmad Zahid: 70% SPM-leaver TVET participation by 2030 — in progress. The official March 2026 update reports 53.9% as of December 2025. This metric is not converted into a completion score.
- Ahmad Zahid: 650,000 TVET students in 2026 — outcome not established in this batch. Status, outcome link and completion are NULL. The reported 2025 intake is not treated as 2026 progress.

All four completion percentages are NULL. Promise dates, outcome-publication dates and the review date are separate. Unknown outcomes are not counted as failed, broken or zero, and are excluded from the achieved-rate denominator. Rates concern this small tracked set, not overall political performance. Published government/party assertions are attributed and are not independent audits. No deadline is inferred except the explicit calendar-year / 13MP end dates.

## Portrait credits

Parliament of Malaysia, original portrait URLs in `manifest.json`. Locally optimised WebP assets preserve the original photographs; no synthetic faces. Source rights remain with the publisher. No endorsement is implied. Missing or failed photographs fall back to initials.

## Checks and recovery

Run `npm run typecheck`, `npm run build`, and `node scripts/check-milestone-data.cjs`. Check both profiles, unknown-only filtering, party rollups, mobile layout, portraits, dated source links, and anonymous access. Confirm only these two entities and four import keys changed. New metadata remains server/admin writable; existing RLS and owner column grants are unchanged.

For a content rollback, compare current records with `before.json`, preserve any intervening votes or owner claims, remove only this batch’s four import keys, and restore only the captured public profile fields. Keep the additive schema in place so deployed code remains compatible. Never reset the database or run the clean-install bundle as rollback.
