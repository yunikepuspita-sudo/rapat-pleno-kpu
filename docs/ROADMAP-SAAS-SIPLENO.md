# 🚀 Roadmap SaaS SIPLENO — Berbayar per-Pleno (Skenario Termurah)

> Tujuan: mengubah prototipe **Portal Rapat Pleno KPU** (saat ini PWA + `localStorage`,
> data per-perangkat) menjadi **SaaS multi-tenant berbayar per-pleno** ala Kerjoo —
> dikembangkan sendiri (*bootstrap*), dengan **Supabase Pro** sebagai baseline infrastruktur.
>
> Model bisnis: **bayar per rapat pleno** yang diproses (1 transaksi = 1 siklus pleno
> end-to-end). Asumsi harga jual lihat `docs/ANGGARAN-SIPLENO.csv`.

---

## 0. Ringkasan modal awal (termurah)

| Pos | Termurah |
|---|---:|
| Biaya sekali bayar (legal, domain, dll) | **±Rp 3–4 juta** |
| Runway operasional 6 bulan (Supabase Pro + Claude + dll) | **±Rp 3–5 juta** |
| **Total modal awal tunai** | **±Rp 6–9 juta** |

Biaya developer = **waktu sendiri** (±3–5 bulan part-time). Rincian angka: `docs/ANGGARAN-SIPLENO.csv`.

**Prinsip hemat:**
- 1 langganan **Supabase Pro** ($25/bln) menggantikan: server backend + database + Auth + Edge Functions + storage. Tidak perlu beli VPS/cloud terpisah.
- **Payment gateway** (Midtrans/Xendit): Rp 0 biaya tetap, hanya potong per transaksi.
- **WhatsApp tetap *click-to-chat*** (`wa.me`) → Rp 0. WA Business API (berbayar) ditunda.
- **Email**: pakai Supabase Auth + tier gratis (Resend 3.000 email/bln) → Rp 0.
- **Branding/landing**: kerjakan sendiri → Rp 0.

---

## 1. Apa yang sudah ada vs yang perlu dibangun

Audit terhadap kode saat ini:

| Fitur | File | Status |
|---|---|---|
| Alur 9 tahap pleno (persiapan→arsip) | `src/pleno/tabs/`, `src/pages/` | ✅ siap, reuse |
| Notulensi AI | `src/pleno/ai.ts`, `supabase/functions/pleno-ai/` | ✅ siap, reuse |
| Berita Acara otomatis (lokal) | `src/pleno/ai.ts:124` | ✅ siap, reuse |
| Voting, QR presensi, kuorum | `src/pleno/utils.ts` | ✅ siap, reuse |
| **Penyimpanan** | `src/pleno/store.ts` (localStorage) | ⚠️ **ganti → Supabase Postgres** |
| **Autentikasi & peran** | — | ❌ bangun |
| **Multi-tenant (banyak instansi)** | — | ❌ bangun |
| **Metering & billing per-pleno** | — | ❌ bangun |
| **Payment gateway** | — | ❌ integrasi |
| **Dashboard admin/tenant + tagihan** | — | ❌ bangun |
| **Keamanan (RLS) & kepatuhan UU PDP** | `src/lib/supabase.ts` (ada klien) | ⚠️ perkuat |

Estimasi: ~60% fitur fungsional sudah jadi. Pekerjaan inti = **backend, auth, multi-tenant, billing**.

---

## 2. Roadmap pengembangan (6 fase)

### Fase 0 — Persiapan (Minggu 1–2)
- [ ] Daftar **PT Perorangan + NIB** (syarat akun bisnis payment gateway & jualan ke instansi).
- [ ] Beli domain `.id`, set email bisnis.
- [ ] Aktifkan **Supabase Pro**, project produksi + staging.
- [ ] Daftar **Midtrans/Xendit** (sandbox dulu).
- [ ] Daftar **Anthropic API** (deposit kecil), simpan `ANTHROPIC_API_KEY` di Supabase secret.
- [ ] Siapkan ToS, Kebijakan Privasi (acuan **UU PDP**) — boleh template.

### Fase 1 — Backend & migrasi data (Minggu 3–6) ⭐ inti
Ganti `localStorage` dengan Supabase Postgres tanpa merombak UI.
- [ ] Rancang skema tabel dari `src/pleno/types.ts`: `rapat`, `peserta`, `presensi`,
      `voting`, `notulensi`, `berita_acara`, `profil_lembaga`, ditambah `organisasi` (tenant).
- [ ] Refactor `src/pleno/store.ts`: pertahankan API hook `usePleno()`, ganti
      implementasi internal dari localStorage → query Supabase (`@supabase/supabase-js` sudah terpasang).
- [ ] Aktifkan **Row-Level Security (RLS)** per `organisasi_id` di semua tabel.
- [ ] Mode *offline-first* opsional: cache lokal + sinkronisasi (tahap lanjut).

### Fase 2 — Auth & multi-tenant (Minggu 7–9)
- [ ] Supabase Auth (email/password + magic link). Gratis di Pro.
- [ ] Tabel `organisasi` (instansi/KPU daerah) + `keanggotaan` (user↔organisasi↔peran).
- [ ] Peran: `admin_instansi`, `operator`, `peserta` — petakan ke peran pleno di `types.ts`.
- [ ] Guard rute (`src/App.tsx`) berdasarkan sesi & peran.
- [ ] Onboarding: daftar instansi → buat organisasi → undang anggota.

### Fase 3 — Metering & billing per-pleno (Minggu 10–12) ⭐ inti monetisasi
- [ ] Tabel `transaksi_pleno`: catat 1 baris saat rapat "difinalisasi" (BA terbit).
      Tentukan **trigger billing** yang adil (mis. saat BA final ditandatangani).
- [ ] Tabel `tagihan` + `saldo`/`kredit` per organisasi.
- [ ] Integrasi **Midtrans/Xendit**: top-up saldo *atau* tagih per-transaksi (pasca-bayar bulanan).
      Rekomendasi termurah: **prabayar kredit pleno** (kurangi biaya channel).
- [ ] Webhook pembayaran → Supabase Edge Function (verifikasi signature, update saldo).
- [ ] Kebijakan: blokir buat-rapat-baru bila saldo habis (atau mode pasca-bayar dgn limit).

### Fase 4 — Dashboard admin & tagihan (Minggu 13–14)
- [ ] Dashboard instansi: jumlah pleno terpakai, sisa kredit, riwayat tagihan, unduh invoice.
- [ ] Dashboard super-admin (kamu): daftar tenant, pemakaian, pendapatan, biaya Claude.
- [ ] Laporan pemakaian Claude per tenant (untuk pantau margin).

### Fase 5 — Keamanan & kepatuhan (Minggu 15–16)
- [ ] Audit RLS (uji isolasi antar-tenant — wajib, data pemilu sensitif).
- [ ] Enkripsi data sensitif, kebijakan retensi, log akses.
- [ ] Halaman kepatuhan **UU PDP**: persetujuan, hak subjek data, DPA.
- [ ] Backup terjadwal (Supabase Pro: PITR tersedia).

### Fase 6 — Beta & peluncuran (Minggu 17+)
- [ ] Uji coba 1–2 instansi pilot (gratis/diskon).
- [ ] Perbaikan dari feedback.
- [ ] Landing page + harga + dokumentasi.
- [ ] (Lanjutan) Pendaftaran **e-Katalog LKPP** untuk jualan ke pemerintah skala besar.

---

## 3. Arsitektur target (termurah)

```
[ PWA React (GitHub Pages / Vercel free) ]
                │  HTTPS
                ▼
[ Supabase Pro ]  ← satu langganan untuk semua:
   ├── Postgres + RLS (data multi-tenant)
   ├── Auth (login, peran)
   ├── Edge Functions (pleno-ai, webhook bayar)
   └── Storage (lampiran, ekspor PDF)
                │
                ├──→ [ Anthropic Claude API ]  (notulensi, bayar per-token)
                └──→ [ Midtrans/Xendit ]       (bayar per-transaksi)

WhatsApp: click-to-chat (wa.me) — Rp 0
Email   : Resend free tier      — Rp 0
```

---

## 4. Risiko & catatan

1. **Pemicu billing harus jelas & adil** — tagih saat nilai tersampaikan (BA final), bukan saat draft, agar tenant tidak protes.
2. **Isolasi tenant (RLS)** adalah fitur keamanan paling kritis — bocor antar-instansi = fatal untuk data pemilu.
3. **Jualan ke instansi pemerintah** butuh badan usaha + NIB; volume besar → e-Katalog LKPP.
4. **Biaya variabel sangat kecil** (token Claude Rp 650–3.900/pleno) — modal awal hampir seluruhnya untuk membangun + bertahan, bukan menjalankan transaksi.
5. **Titik impas** modal Rp 6–9 juta tercapai setelah ±400–600 transaksi pleno (harga jual Rp 15–25 rb/pleno).

---

*Rincian angka anggaran lengkap: lihat `docs/ANGGARAN-SIPLENO.csv` (buka di Excel/Google Sheets).*
