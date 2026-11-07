-- CAB-0001 reviewed editorial import. Apply only after deploying the nullable-progress UI.

begin;

do $$ begin
  if (select count(*) from public.entities where slug in ('anwar-ibrahim','ahmad-zahid-hamidi') and type='politician' and owner_id is null) <> 2 then
    raise exception 'CAB-0001 expects both existing, unclaimed politician profiles';
  end if;
  if exists (select 1 from public.milestones m join public.entities e on e.id=m.entity_id where m.import_key like 'CAB-0001:%' and (m.source_type <> 'editorial' or m.import_key not like 'CAB-0001:' || e.slug || ':%')) then
    raise exception 'CAB-0001 import key conflict';
  end if;
end $$;

update public.entities set
  position='Prime Minister; Minister of Finance; President of PKR',
  constituency='Tambun',
  state='Perak',
  description='Anwar Ibrahim is Malaysia’s tenth Prime Minister and Minister of Finance. He represents Tambun in Perak and is President of Parti Keadilan Rakyat (PKR), a member of Pakatan Harapan. He was sworn in as Prime Minister on 24 November 2022.',
  website='https://www.pmo.gov.my/',
  photo_path='/portraits/anwar-ibrahim.webp',
  photo_source_url='https://www.parlimen.gov.my/images/webuser/ahli/2022/P063.png',
  photo_credit='Parliament of Malaysia',
  profile_checked_at='2026-11-08',
  profile_sources='[{"label": "Prime Minister’s Office · Cabinet", "url": "https://www.pmo.gov.my/en/cabinet/"}, {"label": "PMO · biography", "url": "https://www.pmo.gov.my/ms/profil-pm/"}, {"label": "Parliament · Tambun", "url": "https://www.parlimen.gov.my/profile-ahli.html?uweb=dr&id=4102"}]'::jsonb
where slug='anwar-ibrahim';

update public.entities set
  position='Deputy Prime Minister; Minister of Rural and Regional Development; President of UMNO',
  constituency='Bagan Datuk',
  state='Perak',
  description='Ahmad Zahid Hamidi is Deputy Prime Minister and Minister of Rural and Regional Development. He represents Bagan Datuk in Perak and is President of UMNO, a member of Barisan Nasional. As chair of the National TVET Council, he has announced national targets for participation in technical and vocational education and training.',
  website='https://www.rurallink.gov.my/',
  photo_path='/portraits/ahmad-zahid-hamidi.webp',
  photo_source_url='https://www.parlimen.gov.my/images/webuser/ahli/2022/YAB%20TPM%201.jpg',
  photo_credit='Parliament of Malaysia',
  profile_checked_at='2026-11-08',
  profile_sources='[{"label": "Prime Minister’s Office · Cabinet", "url": "https://www.pmo.gov.my/en/cabinet/"}, {"label": "Parliament · Bagan Datuk", "url": "https://www.parlimen.gov.my/profile-ahli.html?uweb=dr&id=4114"}, {"label": "UMNO · president’s address (11 Sep 2026)", "url": "https://umno-online.my/2026/09/11/ucapan-dasar-presiden-umno-datuk-seri-dr-ahmad-zahid-hamidi/"}, {"label": "TVET council · role and targets", "url": "https://www.tvet.gov.my/index.php/awam-berita/beritapenuh?id=1019"}]'::jsonb
where slug='ahmad-zahid-hamidi';

insert into public.milestones (entity_id, import_key, title, category, status, progress, target_date, promise_date, promise_url, evidence_url, evidence_date, description, progress_note, progress_checked_at, source_type, is_sample)
select e.id, 'CAB-0001:anwar-ibrahim:minimum-wage-1700', 'Raise the statutory monthly minimum wage to RM1,700', 'Economy', 'achieved', null, '2025-08-01', '2024-10-18', 'https://www.pmo.gov.my/ms/ucapanterkini/teks-ucapan-yab-perdana-menteri-pembentangan-rang-undang-undang-perbekalan-2025-2/', 'https://www.jtkswk.gov.my/v2/?lang=en&page_id=3817', null, 'In Budget 2025, Anwar announced a rise from RM1,500 to RM1,700 from 1 February 2025, with a six-month deferment for smaller employers.', 'The Labour Department lists the RM1,700 rate and its February and August 2025 implementation phases. Achieved refers to the statutory rate taking effect, not universal employer compliance or household outcomes. No numerical completion percentage is assigned. The department’s FAQ has no publication date shown.', '2026-11-08', 'editorial', false from public.entities e where e.slug='anwar-ibrahim'
on conflict (import_key) do update set title=excluded.title, category=excluded.category, status=excluded.status, progress=excluded.progress, target_date=excluded.target_date, promise_date=excluded.promise_date, promise_url=excluded.promise_url, evidence_url=excluded.evidence_url, evidence_date=excluded.evidence_date, description=excluded.description, progress_note=excluded.progress_note, progress_checked_at=excluded.progress_checked_at, source_type=excluded.source_type, is_sample=excluded.is_sample;

insert into public.milestones (entity_id, import_key, title, category, status, progress, target_date, promise_date, promise_url, evidence_url, evidence_date, description, progress_note, progress_checked_at, source_type, is_sample)
select e.id, 'CAB-0001:anwar-ibrahim:budi95-launch', 'Introduce targeted RON95 subsidies through BUDI95', 'Economy', 'achieved', null, '2025-09-30', '2025-09-22', 'https://www.mof.gov.my/portal/ms/berita/siaran-media/budi95-pastikan-penyasaran-subsidi-ron95-manfaat-rakyat', 'https://www.mof.gov.my/portal/ms/berita/siaran-media/penambahbaikan-subsidi-ron95-bagi-pemandu-e-hailing-dan-teksi-lapangan-terbang', '2025-11-04', 'Anwar announced BUDI95 for eligible Malaysians from 30 September 2025, with subsidised RON95 priced at RM1.99 per litre at launch.', 'The Finance Ministry’s November 2025 update describes actual September usage and changes to the operating scheme. This supports delivery of the programme launch. It does not establish long-term savings, universal access or today’s pump price; those outcomes are outside this milestone. No numerical completion percentage is assigned.', '2026-11-08', 'editorial', false from public.entities e where e.slug='anwar-ibrahim'
on conflict (import_key) do update set title=excluded.title, category=excluded.category, status=excluded.status, progress=excluded.progress, target_date=excluded.target_date, promise_date=excluded.promise_date, promise_url=excluded.promise_url, evidence_url=excluded.evidence_url, evidence_date=excluded.evidence_date, description=excluded.description, progress_note=excluded.progress_note, progress_checked_at=excluded.progress_checked_at, source_type=excluded.source_type, is_sample=excluded.is_sample;

insert into public.milestones (entity_id, import_key, title, category, status, progress, target_date, promise_date, promise_url, evidence_url, evidence_date, description, progress_note, progress_checked_at, source_type, is_sample)
select e.id, 'CAB-0001:ahmad-zahid-hamidi:tvet-spm-70', 'Reach 70% TVET participation among SPM leavers by 2030', 'Education', 'in_progress', null, '2030-12-31', '2025-12-15', 'https://bernama.com/en/general/news.php?id=2502879', 'https://www.tvet.gov.my/index.php/awam-berita/beritapenuh?id=1019', '2026-03-05', 'As National TVET Council chair, Ahmad Zahid set a 70% participation target for SPM leavers by the end of the Thirteenth Malaysia Plan.', 'The government TVET portal reported participation of 53.9% as of December 2025 and described continuing measures in March 2026. That is a dated participation metric, not a percentage of this promise completed, so completion remains blank. The target has not been recorded as achieved.', '2026-11-08', 'editorial', false from public.entities e where e.slug='ahmad-zahid-hamidi'
on conflict (import_key) do update set title=excluded.title, category=excluded.category, status=excluded.status, progress=excluded.progress, target_date=excluded.target_date, promise_date=excluded.promise_date, promise_url=excluded.promise_url, evidence_url=excluded.evidence_url, evidence_date=excluded.evidence_date, description=excluded.description, progress_note=excluded.progress_note, progress_checked_at=excluded.progress_checked_at, source_type=excluded.source_type, is_sample=excluded.is_sample;

insert into public.milestones (entity_id, import_key, title, category, status, progress, target_date, promise_date, promise_url, evidence_url, evidence_date, description, progress_note, progress_checked_at, source_type, is_sample)
select e.id, 'CAB-0001:ahmad-zahid-hamidi:tvet-650000-2026', 'Have at least 650,000 students enter TVET in 2026', 'Education', null, null, '2026-12-31', '2026-06-05', 'https://www.tvet.gov.my/awam-berita/beritapenuh?id=1151', null, null, 'Ahmad Zahid announced a target of at least 650,000 students in TVET programmes across 1,395 institutions by 31 December 2026.', 'The June 2026 announcement cites roughly 587,000 entrants in the previous year. A comparable 2026 result was not established during this batch. Status and completion percentage remain unknown; the previous-year figure is not used as this year’s progress.', '2026-11-08', 'editorial', false from public.entities e where e.slug='ahmad-zahid-hamidi'
on conflict (import_key) do update set title=excluded.title, category=excluded.category, status=excluded.status, progress=excluded.progress, target_date=excluded.target_date, promise_date=excluded.promise_date, promise_url=excluded.promise_url, evidence_url=excluded.evidence_url, evidence_date=excluded.evidence_date, description=excluded.description, progress_note=excluded.progress_note, progress_checked_at=excluded.progress_checked_at, source_type=excluded.source_type, is_sample=excluded.is_sample;

commit;
