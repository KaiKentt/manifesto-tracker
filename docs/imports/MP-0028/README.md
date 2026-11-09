# MP-0028

Checked 9 November 2026: Salamiah Mohd Nor, Young Syefura Othman, Ismail Sabri Yaakob. Contains three sourced public profiles, three official Parliament portraits and 2 newly selected milestones. Each person has at most two. Missing evidence remains blank; an empty set is a research gap within this initial pass.

`manifest.json` records stable plan identities, current office/affiliation sources, portrait credits, dated evidence, milestone kinds, target precision and gaps. `before.json` captures the affected pre-import public records. Existing profiles and all previous milestones are outside this import’s scope.

`import.sql` is guarded, transactional and repeatable. It checks ownership, parent types, constituency and milestone identity. It preserves IDs, votes, creation dates and claims. An identical rerun makes no content or timestamp updates. MP-0023 introduces the MIC party parent under BN and its real emblem; the remaining batches use existing parents.

Current official spellings replace legacy display spellings without changing fixed plan record IDs. Independent government support does not imply joining a party. Four MPs retain Parliament’s verified PN label where present component-party membership is not established. Bersatu’s CSA is not classified as joining government. The October Wawasan report supersedes Mas Ermieyati’s earlier non-membership report. Aminuddin’s former state office is not presented as current.

Commitments have separate promise/outcome fields. Evidence-only activities and deliveries have no invented earlier promise. Achieved is limited to the described handover or launch. Shared agency responsibility and historical dates are explicit. No numerical completion percentage was verified for this range. Month/year schedules use documented end-of-period markers.

Deploy the assets, apply the reviewed SQL and check anonymous profiles, sources, portraits, hierarchy, search and mobile layout. Compare an identical rerun and all out-of-scope rows. Run TypeScript, production build, existing milestone/auth-return checks and `node scripts/check-politician-imports.cjs MP-0028`. No schema, Auth, grants or permission changes are needed. For recovery, inspect intervening claims, votes and references, then revert only reviewed batch content; never reset the database or remove newly referenced records.

The fixed local plan’s `MP-0028-completion.json` records the final commit, live deployment, validation and remaining gaps after publication.
