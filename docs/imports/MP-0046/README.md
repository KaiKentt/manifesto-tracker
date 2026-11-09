# MP-0046

Checked 10 November 2026: Jimmy Puah Wee Tse, Hassan Abdul Karim, Suhaizan Kaiat. Adds three sourced public profiles, three official portraits and 2 selected milestones. Each person has at most two. Missing evidence remains blank; an empty set records a gap within this initial pass.

`manifest.json` preserves fixed plan IDs and documents current office, party/coalition sources, portrait credits, dated evidence, milestone kinds, calculations, target precision and unresolved fields. `before.json` captures affected pre-import public rows. No existing profile or earlier milestone is changed by this batch.

`import.sql` is transactional and repeatable. It checks ownership, parent types, constituency identity and milestone keys, preserves IDs, votes, creation dates and claims, and performs no update for an identical rerun. New party parents are inserted only in their first selected batch and guarded against identity conflicts. This batch introduces: no new party parent.

Federal and Sabah state alignment are reviewed separately. UPKO’s June 2026 admission into GRS, STAR’s October 2025 exit, continuing federal WARISAN support, parliamentary independent labels, reported suspensions and the separate October CSA are recorded without guessing membership changes. Verdon Bahanda has no assigned party or federal bloc. An unresolved component membership retains the verified parliamentary coalition label.

Evidence-only activities and deliveries have no invented earlier promise. Achieved covers only the stated contribution, handover, programme or launch. Shared agency responsibility and historical dates remain explicit. Two records across this range use dated project/event count ratios; other new percentages remain NULL. Year-only targets have documented display markers and are not exact-day promises.

Deploy the assets before applying SQL, then verify anonymous rendered profiles, source links, portrait assets, hierarchy, directory pagination, unknown states and mobile layout. Compare all out-of-scope rows and an identical rerun. Run TypeScript, the production build, existing milestone/auth-return checks and `node scripts/check-politician-imports.cjs MP-0046`. No schema, Auth, grants or permission changes are required. For recovery, inspect intervening references, claims and votes, then revert only the reviewed batch content; never reset the database or delete referenced profiles blindly.

The fixed local plan’s `MP-0046-completion.json` records the final commit, deployment, executed verification and remaining research gaps after publication.
