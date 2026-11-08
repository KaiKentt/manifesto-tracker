# CAB-0006

Researched 2026-11-09: Chang Lih Kang, Nancy Shukri. Contains two public editorial profiles, two attributed Parliament portraits and 2 sourced milestones. `manifest.json` records sources, dates, scope and gaps. Further milestones are follow-up research, not assumed absent.

`import.sql` is transactional and repeatable. It checks parent types, ownership, constituency and milestone identities. Profile IDs, votes, creation dates and owner claims are preserved. An identical rerun makes no content updates. New party parents, where required, are inserted only if absent, with registered SPR symbols. Senators have no elected constituency; professional senators are attached to the government bloc without inventing party membership.

Use the existing CAB-0001 schema; no new migration, grants or accounts are needed. Deploy assets first, apply this content import through the trusted database connection, then verify the live pages. `before.json` captures affected public records. For recovery, inspect intervening claims, votes and references before reverting only this batch; never reset the database or remove newly referenced profiles.

Unknown outcomes/status/percentages remain NULL. An allocation, announcement or legislative consultation is not proof of final delivery. An achieved launch covers the named launch only. Shared government, agency and national-team outcomes are attributed accordingly. Sector ratios are not converted into completion scores. Source dates and review dates remain separate. A year/month-only deadline uses an end-of-period marker rather than an invented exact-day commitment.

Validation: production build, TypeScript, existing milestone/auth-return checks and `node scripts/check-politician-imports.cjs CAB-0006`; then public pages, local images, source links, party/bloc rollups, unknown display, a mobile viewport, unchanged out-of-scope records and import-rerun stability. Fixed-plan completion JSON files record the deployed commit and live checks after completion.
