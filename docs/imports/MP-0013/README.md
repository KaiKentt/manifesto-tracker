# MP-0013

Checked 9 November 2026: Abdul Hadi Awang, Rosol Wahid, Wan Hassan Mohd Ramli. This initial pass contains three sourced public profiles, three official Parliament portraits and 1 additional milestones. Each person has at most two newly imported milestones. Missing evidence remains blank; an empty milestone set is a scoped research gap, not proof that no public commitments exist.

`manifest.json` records identities, office and affiliation sources, public evidence, dates, milestone kinds, calculation rules and gaps. `before.json` captures affected existing public profiles and their milestones. `import.sql` is guarded, transactional and repeatable; it preserves profile IDs, ownership, votes, creation dates and all pre-existing milestones. An identical rerun makes no content or timestamp updates.

The Speaker has no invented elected constituency or party. Verified coalition affiliation is kept distinct from unverified component-party membership. A confidence-and-supply agreement does not itself imply joining government or prove a later roll-call vote. Independent MPs are not assigned a political party. Existing Hadi Awang, Ahmad Samsuri and Hamzah Zainudin identities are reused when encountered.

Commitments have separate promise and outcome fields. Documented activities and delivery reports use evidence links and publication dates, with no invented earlier promise. In-progress status refers to a dated evidence snapshot. Achieved is limited to the described delivery, not a whole constituency, agency or ministerial performance score. Shared responsibility is explicit. Funding shares, election results, attendance and national sector ratios are not completion percentages.

Deploy the assets, apply the trusted content SQL, check anonymous profiles and hierarchy rollups, and compare an identical rerun. Run TypeScript, production build, existing milestone/auth-return checks and `node scripts/check-politician-imports.cjs MP-0013`. No schema, Auth, grants or permission changes are required. For recovery, inspect subsequent claims, votes and references, then revert only reviewed batch fields; never reset the database or remove newly referenced people.

The fixed import plan’s `MP-0013-completion.json` records the final Git commit, deployment and verified result after publishing.
