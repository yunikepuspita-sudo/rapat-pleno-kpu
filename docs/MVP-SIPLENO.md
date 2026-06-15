# MVP SIPLENO — Pemantauan Pleno 27 Kabkota (Pilot)

Implementasi item **MUST** pada [Lampiran A proposal](./PROPOSAL-SIPLENO-JABAR.md) (skema
swakelola, anggaran Rp 50 juta): fondasi **multi-tenant** + **RBAC 2 level** + **Dashboard
Pemantauan Provinsi** di atas prototipe Portal Rapat Pleno yang sudah ada.

## Apa yang sudah dibangun

| # | Item MUST | Status | Berkas |
|---|---|---|---|
| 1 | Model multi-tenant (1 provinsi + 27 kabkota) | ✅ | `src/pemantauan/wilayah.ts` |
| 2 | Agregasi data pemantauan (per kabkota + total provinsi) | ✅ | `src/pemantauan/agregasi.ts` |
| 3 | **Dashboard Pemantauan Provinsi** (inti nilai) | ✅ | `src/pages/DashboardPemantauan.tsx` (`/pemantauan`) |
| 4 | RBAC 2 level (Pemantau Provinsi / Operator Kabkota) | ✅ | `src/pleno/store.ts` + `src/components/Navbar.tsx` |
| 5 | Lapisan sumber data (backend ↔ demo lokal) | ✅ | `src/lib/pemantauan.ts` |
| 6 | Skema backend multi-tenant + RLS + view agregasi | ✅ | `supabase/migrations/0001_sipleno_mvp.sql` |

**Ditunda ke fase lanjutan (WON'T di MVP):** TTE legal, WhatsApp Business API, AI notulensi
berbayar, pentest formal, SSO, sinkronisasi offline lanjutan, rollout penuh 27 kabkota.

## Cara mencoba (mode demo — tanpa backend)

```bash
npm install
npm run dev      # buka http://localhost:5173
```

1. Di navbar, pilih peran **🛡️ Pemantau Provinsi** → menu **🛰️ Pemantauan** muncul.
2. Buka **/pemantauan** → status agregat 27 kabkota tampil (data contoh deterministik:
   kabkota aktif/belum sinkron, jumlah rapat, berlangsung, BA final, kuorum, tindak lanjut).
3. Ganti peran ke **Operator Kabkota** → menu Pemantauan disembunyikan (demonstrasi RBAC).

> Tanpa backend, dashboard memakai **data contoh** agar langsung dapat diperagakan ke pimpinan.
> Badge "Data contoh (backend belum aktif)" menandakan mode ini.

## Cara mengaktifkan backend (mode produksi — di server KPU)

Sesuai proposal: **Supabase self-hosted di server/data center KPU yang sudah ada** (open-source,
tanpa biaya lisensi). Langkah ringkas:

1. **Pasang Supabase** (Docker) di server KPU — ikuti `supabase/docker` (self-hosting).
2. **Terapkan skema:**
   ```bash
   supabase db push        # atau: psql "$DATABASE_URL" -f supabase/migrations/0001_sipleno_mvp.sql
   ```
   Migrasi membuat tabel `wilayah` (terisi 28 wilayah), `profil`, `rapat`, fungsi RBAC,
   kebijakan RLS, dan view agregasi `v_pemantauan_wilayah`.
3. **Konfigurasi frontend** — salin `.env.example` ke `.env`:
   ```
   VITE_SUPABASE_URL=https://sipleno.kpu-jabar.go.id
   VITE_SUPABASE_ANON_KEY=...
   ```
4. **Provisioning pengguna & peran** (contoh SQL, setelah user dibuat di Auth):
   ```sql
   -- Pemantau Provinsi (akses baca seluruh kabkota)
   insert into public.profil (id, nama, peran, wilayah_kode)
   values ('<uuid-user>', 'Operator Provinsi', 'provinsi', '32');

   -- Operator Kabupaten/Kota (hanya wilayahnya)
   insert into public.profil (id, nama, peran, wilayah_kode)
   values ('<uuid-user>', 'Operator KPU Kota Bandung', 'kabkota', '3273');
   ```
5. Build & deploy statis ke server KPU:
   ```bash
   npm run build   # hasil di dist/ — sajikan via Nginx/Apache server KPU
   ```

Setelah backend aktif, badge dashboard berubah menjadi **"Tersambung backend"** dan data ditarik
dari view `v_pemantauan_wilayah` (RLS memastikan Provinsi melihat seluruh kabkota; Operator hanya
wilayahnya).

## Model keamanan (RBAC + RLS)

- **Pemantau Provinsi (`provinsi`)** — `SELECT` seluruh `rapat` lintas 27 kabkota (read-only
  monitoring); tidak dapat mengubah data kabkota.
- **Operator Kabkota (`kabkota`)** — `SELECT/INSERT/UPDATE/DELETE` hanya pada `rapat` dengan
  `wilayah_kode` miliknya. Isolasi antar-tenant ditegakkan di level basis data via **RLS**.
- View `v_pemantauan_wilayah` memakai `security_invoker` sehingga RLS pemanggil tetap berlaku.

> Catatan MVP: pemilih peran di navbar hanya untuk **peragaan**. Pada produksi, peran ditetapkan
> backend (klaim auth + tabel `profil`), bukan dipilih di klien.

## Langkah lanjutan (di luar MVP)

Karena fondasi multi-tenant sudah ada, scale-up berikutnya **bukan bangun ulang**:
migrasi penuh modul pleno (presensi/voting/BA) ke API, integrasi TTE BSrE & WhatsApp Business API,
pentest (BSSN), serta pelatihan & rollout 27 kabkota — sesuai Bagian 4 & 5 proposal.
