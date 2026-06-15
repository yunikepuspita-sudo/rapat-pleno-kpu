-- ===========================================================================
-- MVP SIPLENO — Skema multi-tenant + RBAC + view pemantauan provinsi.
--
-- Dijalankan pada PostgreSQL / Supabase yang di-self-host di SERVER KPU.
-- Mewujudkan item MUST pada Lampiran A proposal (anggaran Rp 50 juta):
--   1) Backend + DB multi-tenant (pengganti localStorage)
--   2) RBAC dasar 2 level (Pemantau Provinsi & Operator Kabkota)
--   3) Sumber data Dashboard Pemantauan Provinsi (view agregasi)
--
-- Terapkan:  supabase db push     (atau: psql -f 0001_sipleno_mvp.sql)
-- ===========================================================================

-- --------------------------------------------------------------------------
-- 1. Tenant: wilayah (1 provinsi + 27 kabupaten/kota Jawa Barat)
-- --------------------------------------------------------------------------
create table if not exists public.wilayah (
  kode  text primary key,
  nama  text not null,
  jenis text not null check (jenis in ('provinsi', 'kabupaten', 'kota'))
);

insert into public.wilayah (kode, nama, jenis) values
  ('32',   'Provinsi Jawa Barat',      'provinsi'),
  ('3201', 'Kabupaten Bogor',          'kabupaten'),
  ('3202', 'Kabupaten Sukabumi',       'kabupaten'),
  ('3203', 'Kabupaten Cianjur',        'kabupaten'),
  ('3204', 'Kabupaten Bandung',        'kabupaten'),
  ('3205', 'Kabupaten Garut',          'kabupaten'),
  ('3206', 'Kabupaten Tasikmalaya',    'kabupaten'),
  ('3207', 'Kabupaten Ciamis',         'kabupaten'),
  ('3208', 'Kabupaten Kuningan',       'kabupaten'),
  ('3209', 'Kabupaten Cirebon',        'kabupaten'),
  ('3210', 'Kabupaten Majalengka',     'kabupaten'),
  ('3211', 'Kabupaten Sumedang',       'kabupaten'),
  ('3212', 'Kabupaten Indramayu',      'kabupaten'),
  ('3213', 'Kabupaten Subang',         'kabupaten'),
  ('3214', 'Kabupaten Purwakarta',     'kabupaten'),
  ('3215', 'Kabupaten Karawang',       'kabupaten'),
  ('3216', 'Kabupaten Bekasi',         'kabupaten'),
  ('3217', 'Kabupaten Bandung Barat',  'kabupaten'),
  ('3218', 'Kabupaten Pangandaran',    'kabupaten'),
  ('3271', 'Kota Bogor',               'kota'),
  ('3272', 'Kota Sukabumi',            'kota'),
  ('3273', 'Kota Bandung',             'kota'),
  ('3274', 'Kota Cirebon',             'kota'),
  ('3275', 'Kota Bekasi',              'kota'),
  ('3276', 'Kota Depok',               'kota'),
  ('3277', 'Kota Cimahi',              'kota'),
  ('3278', 'Kota Tasikmalaya',         'kota'),
  ('3279', 'Kota Banjar',              'kota')
on conflict (kode) do nothing;

-- --------------------------------------------------------------------------
-- 2. Profil pengguna + peran SIPLENO (RBAC). Terhubung ke auth.users.
--    peran: 'provinsi' (pemantau lintas kabkota) | 'kabkota' (operator).
-- --------------------------------------------------------------------------
create table if not exists public.profil (
  id           uuid primary key references auth.users (id) on delete cascade,
  nama         text not null default '',
  peran        text not null default 'kabkota' check (peran in ('provinsi', 'kabkota')),
  wilayah_kode text references public.wilayah (kode)
);

-- --------------------------------------------------------------------------
-- 3. Rapat pleno (data inti per tenant). Payload penuh disimpan sebagai JSONB
--    agar kompatibel dengan model data frontend; kolom turunan untuk agregasi.
-- --------------------------------------------------------------------------
create table if not exists public.rapat (
  id                     uuid primary key default gen_random_uuid(),
  wilayah_kode           text not null references public.wilayah (kode),
  nomor                  text not null default '',
  judul                  text not null default '',
  tanggal                date,
  status                 text not null default 'draft'
                           check (status in ('draft','terjadwal','berlangsung','selesai','diarsipkan')),
  ba_status              text not null default 'belum'
                           check (ba_status in ('belum','draft','review','final')),
  kuorum                 boolean,
  tindak_lanjut_total    integer not null default 0,
  tindak_lanjut_selesai  integer not null default 0,
  payload                jsonb not null default '{}'::jsonb,
  dibuat_pada            timestamptz not null default now(),
  diperbarui_pada        timestamptz not null default now()
);

create index if not exists idx_rapat_wilayah on public.rapat (wilayah_kode);
create index if not exists idx_rapat_status  on public.rapat (status);

-- --------------------------------------------------------------------------
-- 4. Helper RBAC (security definer agar tidak rekursif terhadap RLS profil).
-- --------------------------------------------------------------------------
create or replace function public.sipleno_peran()
  returns text language sql stable security definer set search_path = public as $$
    select peran from public.profil where id = auth.uid()
  $$;

create or replace function public.sipleno_wilayah()
  returns text language sql stable security definer set search_path = public as $$
    select wilayah_kode from public.profil where id = auth.uid()
  $$;

-- --------------------------------------------------------------------------
-- 5. Row-Level Security
-- --------------------------------------------------------------------------
alter table public.wilayah enable row level security;
alter table public.profil  enable row level security;
alter table public.rapat   enable row level security;

-- Wilayah: dapat dibaca semua pengguna terautentikasi (referensi).
drop policy if exists wilayah_read on public.wilayah;
create policy wilayah_read on public.wilayah
  for select to authenticated using (true);

-- Profil: pengguna lihat profilnya sendiri; Pemantau Provinsi lihat semua.
drop policy if exists profil_read on public.profil;
create policy profil_read on public.profil
  for select to authenticated
  using (id = auth.uid() or public.sipleno_peran() = 'provinsi');

-- Rapat — SELECT: Provinsi melihat seluruh kabkota; Operator hanya wilayahnya.
drop policy if exists rapat_select on public.rapat;
create policy rapat_select on public.rapat
  for select to authenticated
  using (public.sipleno_peran() = 'provinsi' or wilayah_kode = public.sipleno_wilayah());

-- Rapat — tulis (INSERT/UPDATE/DELETE): hanya Operator pada wilayahnya sendiri.
drop policy if exists rapat_insert on public.rapat;
create policy rapat_insert on public.rapat
  for insert to authenticated
  with check (public.sipleno_peran() = 'kabkota' and wilayah_kode = public.sipleno_wilayah());

drop policy if exists rapat_update on public.rapat;
create policy rapat_update on public.rapat
  for update to authenticated
  using (public.sipleno_peran() = 'kabkota' and wilayah_kode = public.sipleno_wilayah())
  with check (wilayah_kode = public.sipleno_wilayah());

drop policy if exists rapat_delete on public.rapat;
create policy rapat_delete on public.rapat
  for delete to authenticated
  using (public.sipleno_peran() = 'kabkota' and wilayah_kode = public.sipleno_wilayah());

-- --------------------------------------------------------------------------
-- 6. View pemantauan provinsi — agregasi per wilayah.
--    security_invoker agar RLS pemanggil (Pemantau Provinsi) berlaku.
-- --------------------------------------------------------------------------
create or replace view public.v_pemantauan_wilayah
  with (security_invoker = true) as
with agg as (
  select
    r.wilayah_kode,
    count(*)                                              as total_rapat,
    count(*) filter (where r.status = 'terjadwal')        as terjadwal,
    count(*) filter (where r.status = 'berlangsung')      as berlangsung,
    count(*) filter (where r.status in ('selesai','diarsipkan')) as selesai,
    count(*) filter (where r.ba_status = 'final')         as ba_final,
    coalesce(sum(r.tindak_lanjut_total), 0)               as tindak_lanjut_total,
    coalesce(sum(r.tindak_lanjut_selesai), 0)             as tindak_lanjut_selesai,
    max(r.tanggal)                                        as rapat_terakhir,
    max(r.diperbarui_pada)                                as diperbarui_pada
  from public.rapat r
  group by r.wilayah_kode
),
kuorum_terakhir as (
  select distinct on (r.wilayah_kode) r.wilayah_kode, r.kuorum
  from public.rapat r
  where r.tanggal is not null
  order by r.wilayah_kode, r.tanggal desc, r.diperbarui_pada desc
)
select
  w.kode,
  w.nama,
  w.jenis,
  (a.total_rapat is not null)                  as aktif,
  coalesce(a.total_rapat, 0)                   as total_rapat,
  coalesce(a.terjadwal, 0)                     as terjadwal,
  coalesce(a.berlangsung, 0)                   as berlangsung,
  coalesce(a.selesai, 0)                       as selesai,
  coalesce(a.ba_final, 0)                      as ba_final,
  coalesce(a.tindak_lanjut_total, 0)           as tindak_lanjut_total,
  coalesce(a.tindak_lanjut_selesai, 0)         as tindak_lanjut_selesai,
  k.kuorum                                     as kuorum_terakhir,
  a.rapat_terakhir,
  a.diperbarui_pada
from public.wilayah w
left join agg a            on a.wilayah_kode = w.kode
left join kuorum_terakhir k on k.wilayah_kode = w.kode;

grant select on public.v_pemantauan_wilayah to authenticated;
