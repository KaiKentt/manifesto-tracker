-- ════════════════════════════════════════════════════════════════════
--  Seed data — snapshot compiled 2 November 2026 from public news reports.
--
--  • Blocs, coalitions, parties and politicians are real, with short
--    factual descriptions of their federal-level position. Malaysian
--    alignments changed several times in 2026: an editor must re-check
--    every row before launch.
--  • Every milestone below is SAMPLE data (is_sample = true, title starts
--    with "[Sample]"). They are placeholders to show the UI, not tracked
--    pledges. Both sides get the same number and the same mix of statuses.
--    Replace them with sourced manifesto items before going public.
-- ════════════════════════════════════════════════════════════════════

truncate public.votes, public.milestones, public.politician_requests restart identity cascade;
delete from public.entities;

-- ── Blocs ───────────────────────────────────────────────────────────
insert into public.entities (type, slug, name, short_name, bloc, description) values
('bloc', 'government', 'Unity Government', 'Government', 'government',
 'Federal government formed after the 15th General Election (November 2022) and led by Prime Minister Anwar Ibrahim. It comprises Pakatan Harapan, Barisan Nasional, Gabungan Parti Sarawak, Gabungan Rakyat Sabah and several other parties.'),
('bloc', 'opposition', 'Opposition', 'Opposition', 'opposition',
 'Opposition bloc in the Dewan Rakyat, led by Perikatan Nasional. Leader of the Opposition: Hamzah Zainudin (since 18 June 2026).');

-- ── Coalitions ──────────────────────────────────────────────────────
insert into public.entities (type, slug, name, short_name, bloc, parent_id, description) values
('alliance', 'pakatan-harapan', 'Pakatan Harapan', 'PH', 'government',
 (select id from public.entities where slug = 'government'),
 'Coalition of PKR, DAP and Amanah. Leads the Unity Government.'),
('alliance', 'barisan-nasional', 'Barisan Nasional', 'BN', 'government',
 (select id from public.entities where slug = 'government'),
 'Coalition led by UMNO. Part of the Unity Government at federal level.'),
('alliance', 'gabungan-parti-sarawak', 'Gabungan Parti Sarawak', 'GPS', 'government',
 (select id from public.entities where slug = 'government'),
 'Sarawak-based coalition led by PBB. Part of the Unity Government.'),
('alliance', 'gabungan-rakyat-sabah', 'Gabungan Rakyat Sabah', 'GRS', 'government',
 (select id from public.entities where slug = 'government'),
 'Sabah-based coalition. Part of the Unity Government.'),
('alliance', 'perikatan-nasional', 'Perikatan Nasional', 'PN', 'opposition',
 (select id from public.entities where slug = 'opposition'),
 'Main opposition coalition. PAS is its largest component; Parti Wawasan Negara joined in June 2026. Chairman: Ahmad Samsuri Mokhtar.');

-- ── Parties ─────────────────────────────────────────────────────────
insert into public.entities (type, slug, name, short_name, bloc, parent_id, description) values
('party', 'pkr', 'Parti Keadilan Rakyat', 'PKR', 'government',
 (select id from public.entities where slug = 'pakatan-harapan'),
 'Component of Pakatan Harapan. President: Anwar Ibrahim.'),
('party', 'dap', 'Democratic Action Party', 'DAP', 'government',
 (select id from public.entities where slug = 'pakatan-harapan'),
 'Component of Pakatan Harapan. Secretary-General: Anthony Loke.'),
('party', 'amanah', 'Parti Amanah Negara', 'Amanah', 'government',
 (select id from public.entities where slug = 'pakatan-harapan'),
 'Component of Pakatan Harapan.'),
('party', 'umno', 'United Malays National Organisation', 'UMNO', 'government',
 (select id from public.entities where slug = 'barisan-nasional'),
 'Leading component of Barisan Nasional. President: Ahmad Zahid Hamidi.'),
('party', 'mca', 'Malaysian Chinese Association', 'MCA', 'government',
 (select id from public.entities where slug = 'barisan-nasional'),
 'Component of Barisan Nasional.'),
('party', 'pbb', 'Parti Pesaka Bumiputera Bersatu', 'PBB', 'government',
 (select id from public.entities where slug = 'gabungan-parti-sarawak'),
 'Leading component of Gabungan Parti Sarawak.'),
('party', 'pas', 'Parti Islam Se-Malaysia', 'PAS', 'opposition',
 (select id from public.entities where slug = 'perikatan-nasional'),
 'Largest component of Perikatan Nasional. President: Abdul Hadi Awang.'),
('party', 'wawasan', 'Parti Wawasan Negara', 'Wawasan', 'opposition',
 (select id from public.entities where slug = 'perikatan-nasional'),
 'Formerly Parti Cinta Malaysia, renamed in June 2026 and accepted as a Perikatan Nasional component. President: Hamzah Zainudin.'),
('party', 'bersatu', 'Parti Pribumi Bersatu Malaysia', 'Bersatu', 'opposition', null,
 'Opposition party in the Dewan Rakyat.');

-- ── Politicians (editorial profiles; each can be claimed by the person) ─
insert into public.entities (type, slug, name, bloc, parent_id, position, constituency, state, description) values
('politician', 'anwar-ibrahim', 'Anwar Ibrahim', 'government',
 (select id from public.entities where slug = 'pkr'),
 'Prime Minister; President of PKR', 'Tambun', 'Perak',
 'Sworn in as the 10th Prime Minister of Malaysia on 24 November 2022.'),
('politician', 'ahmad-zahid-hamidi', 'Ahmad Zahid Hamidi', 'government',
 (select id from public.entities where slug = 'umno'),
 'Deputy Prime Minister; President of UMNO', 'Bagan Datuk', 'Perak',
 'Deputy Prime Minister since December 2022.'),
('politician', 'anthony-loke', 'Anthony Loke', 'government',
 (select id from public.entities where slug = 'dap'),
 'Secretary-General of DAP', 'Seremban', 'Negeri Sembilan',
 'DAP Secretary-General since March 2022.'),
('politician', 'hamzah-zainudin', 'Hamzah Zainudin', 'opposition',
 (select id from public.entities where slug = 'wawasan'),
 'Leader of the Opposition; President of Parti Wawasan Negara', 'Larut', 'Perak',
 'Returned as Leader of the Opposition in the Dewan Rakyat on 18 June 2026.'),
('politician', 'ahmad-samsuri-mokhtar', 'Ahmad Samsuri Mokhtar', 'opposition',
 (select id from public.entities where slug = 'pas'),
 'Chairman of Perikatan Nasional; Vice-President of PAS', 'Kemaman', 'Terengganu',
 'Named Perikatan Nasional chairman in early 2026.'),
('politician', 'abdul-hadi-awang', 'Abdul Hadi Awang', 'opposition',
 (select id from public.entities where slug = 'pas'),
 'President of PAS', 'Marang', 'Terengganu',
 'President of PAS.');

-- ── Sample milestones: 6 per side, identical status mix ────────────
-- Status mix per side: 1 achieved, 2 in progress, 1 delayed, 1 pledged, 1 broken.
insert into public.milestones
  (entity_id, title, description, category, status, progress, target_date, source_type, is_sample)
values
-- Government side
((select id from public.entities where slug = 'government'),
 '[Sample] Expand targeted cash aid to low-income households',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Social welfare', 'achieved', 100, '2026-06-30', 'editorial', true),
((select id from public.entities where slug = 'government'),
 '[Sample] Reform the public procurement process',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Governance', 'broken', 10, '2026-03-31', 'editorial', true),
((select id from public.entities where slug = 'pakatan-harapan'),
 '[Sample] Table a parliamentary services act',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Governance', 'in_progress', 40, '2027-06-30', 'editorial', true),
((select id from public.entities where slug = 'barisan-nasional'),
 '[Sample] Upgrade rural roads in underserved districts',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Infrastructure', 'in_progress', 65, '2027-12-31', 'editorial', true),
((select id from public.entities where slug = 'gabungan-parti-sarawak'),
 '[Sample] Extend rural broadband coverage',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Digital', 'delayed', 25, '2026-09-30', 'editorial', true),
((select id from public.entities where slug = 'pkr'),
 '[Sample] Pilot free early childhood education',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Education', 'pledged', 0, '2027-12-31', 'editorial', true),
-- Opposition side
((select id from public.entities where slug = 'opposition'),
 '[Sample] Propose an alternative cost-of-living package',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Economy', 'achieved', 100, '2026-06-30', 'editorial', true),
((select id from public.entities where slug = 'opposition'),
 '[Sample] Publish a shadow budget every year',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Governance', 'broken', 10, '2026-03-31', 'editorial', true),
((select id from public.entities where slug = 'perikatan-nasional'),
 '[Sample] Table a motion on electoral reform',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Governance', 'in_progress', 40, '2027-06-30', 'editorial', true),
((select id from public.entities where slug = 'pas'),
 '[Sample] Improve water supply in states the party governs',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Infrastructure', 'in_progress', 65, '2027-12-31', 'editorial', true),
((select id from public.entities where slug = 'wawasan'),
 '[Sample] Launch a youth skills programme',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Education', 'delayed', 25, '2026-09-30', 'editorial', true),
((select id from public.entities where slug = 'perikatan-nasional'),
 '[Sample] Expand state-level affordable housing',
 'Placeholder record for the prototype — not a real tracked pledge.',
 'Housing', 'pledged', 0, '2027-12-31', 'editorial', true);
