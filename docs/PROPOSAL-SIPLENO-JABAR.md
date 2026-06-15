# Proposal Teknis & Anggaran — SIPLENO KPU Provinsi Jawa Barat

**Sistem Informasi Pleno (SIPLENO)** — Platform digitalisasi & pemantauan Rapat Pleno
terintegrasi untuk KPU Provinsi Jawa Barat dan **27 Kabupaten/Kota**.

| | |
|---|---|
| **Pemberi kerja (calon)** | KPU Provinsi Jawa Barat |
| **Cakupan** | 1 KPU Provinsi + 27 KPU Kabupaten/Kota |
| **Basis** | Prototipe "Portal Rapat Pleno KPU" (PWA, sudah berjalan) |
| **Status dokumen** | Draf penawaran — angka indikatif, final menyesuaikan KAK/HPS |
| **Tanggal** | Juni 2026 |

> Catatan: seluruh nominal bersifat **indikatif (estimasi)** untuk perencanaan dan negosiasi.
> Angka final mengikuti Kerangka Acuan Kerja (KAK), Harga Perkiraan Sendiri (HPS) instansi,
> standar biaya (SBM/SBK) yang berlaku, dan hasil klarifikasi teknis.

---

## 1. Ringkasan Eksekutif

Prototipe yang sudah ada membuktikan **alur kerja pleno 9 tahap end-to-end** (persiapan →
undangan → presensi QR → pelaksanaan → notulensi AI → voting → Berita Acara → tanda tangan →
arsip) dalam bentuk **PWA satu-pengguna berbasis `localStorage`**. Prototipe ini sangat kuat
sebagai **bukti konsep dan alat demo**, tetapi **belum** memiliki backend multi-instansi,
otentikasi, kontrol akses, maupun dashboard pemantauan lintas wilayah yang dibutuhkan
KPU Provinsi untuk memantau 27 kabupaten/kota.

SIPLENO adalah **produktisasi** prototipe tersebut menjadi platform **multi-tenant** dengan:

1. **Backend & basis data terpusat** (server-backed, bukan lagi `localStorage`).
2. **Hierarki organisasi**: KPU Provinsi sebagai *pemantau* (supervisi/agregasi), 27 KPU
   Kabupaten/Kota sebagai *pelaksana* pleno.
3. **Dashboard Pemantauan Provinsi real-time**: status pleno, kuorum, progres rekapitulasi,
   Berita Acara, dan tindak lanjut keputusan dari seluruh 27 kabkota dalam satu layar.
4. **Otentikasi & RBAC** berjenjang, **audit trail**, dan kepatuhan **SPBE/UU PDP**.
5. **Integrasi resmi**: Tanda Tangan Elektronik (TTE) tersertifikasi, WhatsApp Business API,
   notulensi AI, dan single sign-on.

Estimasi nilai proyek: **pengembangan satu kali ± Rp 1,95 miliar** + **pemeliharaan & operasional
± Rp 480 juta/tahun** (lihat Bagian 6 untuk dua skema komersial: beli-putus vs. langganan).

---

## 2. Kondisi Prototipe Saat Ini (baseline)

| Aspek | Kondisi prototipe | Implikasi untuk produksi |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite, PWA (installable, offline) | **Dipertahankan** — aset utama, tinggal disambungkan ke API |
| Penyimpanan | `localStorage` per-perangkat | **Diganti** backend terpusat + sinkronisasi offline |
| Multi-instansi | Tidak ada (single-tenant) | **Dibangun** model 28 tenant berjenjang |
| Otentikasi | "Login" lokal sekadar penanda perangkat | **Dibangun** auth + RBAC + SSO |
| Pemantauan | Dashboard tindak lanjut 1 instansi | **Dibangun** dashboard agregasi 27 kabkota |
| AI notulensi | Supabase Edge Function (Claude) opsional | **Dipertahankan & diskalakan** dengan kontrol biaya/residency |
| Tanda tangan | Penanda boolean (belum legal) | **Diintegrasikan** TTE tersertifikasi (BSrE/penyedia) |
| Undangan WA | Click-to-chat (manual) | **Ditingkatkan** ke WhatsApp Business API (broadcast resmi) |
| Hosting | GitHub Pages (statis) | **Dipindah** ke cloud pemerintah/PDN sesuai SPBE |
| Keamanan | Belum ada (demo publik) | **Pentest, hardening, audit, enkripsi** |

**Kesimpulan:** ± 40% nilai produk (alur kerja, UI/UX, model data, generator BA/notulensi)
sudah tersedia dari prototipe. Pekerjaan inti adalah **lapisan backend, multi-tenant,
pemantauan, keamanan, dan integrasi resmi**.

---

## 3. Arsitektur Target SIPLENO

```
                    ┌─────────────────────────────────────────────┐
                    │   DASHBOARD PEMANTAUAN  KPU PROVINSI JABAR    │
                    │  (agregasi real-time status 27 kabkota)       │
                    └───────────────────────┬─────────────────────┘
                                            │  (read/supervisi)
        ┌───────────────────────────────────┼───────────────────────────────────┐
        │                                   │                                   │
   ┌────▼─────┐   ┌──────────┐   ┌──────────┐  …  ┌──────────┐   ┌──────────────┐
   │ KPU Kab.  │   │ KPU Kab. │   │ KPU Kota │     │ KPU Kab. │   │ 27 tenant     │
   │ Bandung   │   │ Bogor    │   │ Bekasi   │     │ Cirebon  │   │ kab/kota      │
   └───────────┘   └──────────┘   └──────────┘     └──────────┘   └──────────────┘
        │  alur pleno 9 tahap (PWA) per kabkota — data terisolasi per tenant
        ▼
   ┌──────────────────────────────────────────────────────────────────────────┐
   │  BACKEND SIPLENO (API + Auth/RBAC + DB multi-tenant + Storage + Realtime)  │
   │  Integrasi: TTE • WhatsApp Business API • Email • AI Notulensi • SSO       │
   └──────────────────────────────────────────────────────────────────────────┘
```

**Komponen utama yang dibangun:**

- **API & basis data multi-tenant** — PostgreSQL dengan isolasi per tenant (Row-Level Security),
  28 tenant (1 provinsi + 27 kabkota), skema mengikuti model data prototipe (`Rapat`, `Peserta`,
  `Voting`, `BeritaAcara`, `TindakLanjut`, dst.).
- **Otentikasi & RBAC berjenjang** — peran: Super Admin (provinsi), Admin Kabkota, Komisioner
  (Ketua/Anggota), Sekretariat, Operator, dan **Pemantau Provinsi** (akses baca lintas wilayah).
- **Dashboard Pemantauan Provinsi** — peta & tabel 27 kabkota: jumlah pleno (terjadwal/berlangsung/
  selesai), status kuorum, progres Berita Acara, dan SLA tindak lanjut; ekspor laporan.
- **Sinkronisasi offline-first** — PWA tetap berfungsi saat jaringan tidak stabil di lapangan,
  lalu sinkron ke server (penting untuk daerah dengan konektivitas terbatas).
- **Integrasi resmi** — TTE tersertifikasi (BSrE atau penyelenggara sertifikasi elektronik),
  WhatsApp Business API untuk undangan/notifikasi, email, dan notulensi AI (Claude).
- **Keamanan & kepatuhan** — enkripsi at-rest & in-transit, audit log, manajemen secret, sesuai
  **SPBE**, **UU No. 27/2022 (PDP)**, dan praktik selaras ISO 27001; hosting di **PDN/cloud
  pemerintah** yang disetujui.

---

## 4. Roadmap Teknis (7 fase, ± 7 bulan)

| Fase | Durasi | Fokus | Keluaran (deliverable) |
|---|---|---|---|
| **F0 — Discovery & Penyelarasan** | 3 mgg | KAK, kebutuhan 27 kabkota, arsitektur final, DPTRA/standar data | Dokumen SRS, desain arsitektur, rencana keamanan, backlog |
| **F1 — Fondasi Backend & Multi-tenant** | 6 mgg | API, DB PostgreSQL + RLS, 28 tenant, migrasi model data prototipe, auth | Backend MVP, skema DB, lingkungan dev/staging, CI/CD |
| **F2 — RBAC, Auth & Migrasi Frontend** | 5 mgg | SSO, peran berjenjang, audit log; sambung PWA ke API (ganti `localStorage`) | Login & otorisasi, PWA tersambung backend, sinkronisasi offline |
| **F3 — Dashboard Pemantauan Provinsi** | 4 mgg | Agregasi real-time 27 kabkota, laporan, ekspor | Dashboard provinsi, modul laporan & ekspor PDF/Excel |
| **F4 — Integrasi Resmi** | 5 mgg | TTE tersertifikasi, WhatsApp Business API, email, AI notulensi terskala | BA bertanda tangan legal, notifikasi resmi, notulensi AI produksi |
| **F5 — Keamanan, UAT & Hardening** | 5 mgg | Penetration test, perbaikan, UAT bersama KPU, dokumentasi | Laporan pentest + remediasi, BAUT, dokumen operasional |
| **F6 — Pelatihan, Go-Live & Hypercare** | 4 mgg | ToT, rollout 27 kabkota, pendampingan intensif | Pelatihan selesai, sistem produksi, masa hypercare 30 hari |

**Total pengembangan:** ± **32 minggu (± 7 bulan)**. Fase dapat di-*overlap* untuk mempercepat,
atau dipecah menjadi termin anggaran tahunan bila diperlukan.

**Setelah go-live:** masa **pemeliharaan & dukungan (SLA)** berjalan tahunan (lihat Bagian 6).

---

## 5. Rincian Anggaran (RAB)

> Semua nilai dalam Rupiah, **indikatif** untuk perencanaan/HPS. Belum termasuk PPN 11%
> (kecuali dinyatakan). Tarif SDM mengikuti kisaran pasar pengembang Indonesia 2026.

### 5.1 Komponen A — Sumber Daya Manusia (Tim Pengembangan)

| Peran | Tarif/bulan | Alokasi (bln) | Subtotal |
|---|---:|---:|---:|
| Project Manager | 35.000.000 | 7 | 245.000.000 |
| Solution Architect / Tech Lead | 40.000.000 | 7 | 280.000.000 |
| Backend Engineer (2 orang) | 28.000.000 | 6 × 2 | 336.000.000 |
| Frontend Engineer (2 orang) | 25.000.000 | 6 × 2 | 300.000.000 |
| DevOps / SRE | 30.000.000 | 5 | 150.000.000 |
| UI/UX Designer | 22.000.000 | 3 | 66.000.000 |
| QA Engineer | 20.000.000 | 5 | 100.000.000 |
| Security Engineer (paruh waktu) | 35.000.000 | 2 | 70.000.000 |
| Business Analyst | 22.000.000 | 4 | 88.000.000 |
| **Subtotal SDM** | | | **1.635.000.000** |

### 5.2 Komponen B — Infrastruktur & Lisensi (Tahun ke-1)

| Item | Estimasi/tahun |
|---|---:|
| Hosting cloud pemerintah/PDN (compute, DB, storage, CDN, backup) — ± Rp 10 jt/bln | 120.000.000 |
| WhatsApp Business API (BSP + biaya percakapan) | 30.000.000 |
| TTE tersertifikasi — integrasi & kuota tanda tangan (BSrE/penyelenggara) | 50.000.000 |
| AI Notulensi (token Claude API, sesuai volume rapat) | 24.000.000 |
| Domain `.go.id`, sertifikat SSL, monitoring & logging tools | 16.000.000 |
| **Subtotal Infrastruktur & Lisensi (Th-1)** | **240.000.000** |

> Catatan: TTE via **BSrE (BSSN)** dapat **gratis untuk instansi pemerintah**; angka di atas
> mengakomodasi opsi penyelenggara komersial (mis. Privy/Peruri) bila dipilih. Hosting dapat
> menggunakan **Pusat Data Nasional (PDN)** sesuai kebijakan SPBE — biaya menyesuaikan.

### 5.3 Komponen C — Layanan Pihak Ketiga & Kepatuhan

| Item | Estimasi |
|---|---:|
| Penetration test independen + laporan & sertifikat | 75.000.000 |
| Audit kesiapan SPBE & dokumentasi kepatuhan PDP | 35.000.000 |
| **Subtotal Pihak Ketiga** | **110.000.000** |

### 5.4 Komponen D — Pelatihan & Manajemen Perubahan (27 Kabkota)

| Item | Estimasi |
|---|---:|
| Penyusunan materi, modul e-learning, & video panduan | 30.000.000 |
| Training of Trainers (ToT) + workshop regional (beberapa batch) | 80.000.000 |
| Perjalanan dinas, akomodasi, logistik pelatihan | 50.000.000 |
| **Subtotal Pelatihan & Rollout** | **160.000.000** |

### 5.5 Komponen E — Manajemen Proyek, Dokumentasi & Kontingensi

| Item | Estimasi |
|---|---:|
| Dokumentasi (SRS, manual, dok. teknis & operasional), legal/kontrak | 60.000.000 |
| Kontingensi / cadangan risiko (± 5%) | 110.000.000 |
| **Subtotal** | **170.000.000** |

### 5.6 Rekapitulasi Biaya Pengembangan (satu kali)

| Komponen | Nilai |
|---|---:|
| A. Sumber Daya Manusia | 1.635.000.000 |
| B. Infrastruktur & Lisensi (Th-1) | 240.000.000 |
| C. Pihak Ketiga & Kepatuhan | 110.000.000 |
| D. Pelatihan & Rollout | 160.000.000 |
| E. Manajemen, Dokumentasi & Kontingensi | 170.000.000 |
| **Subtotal** | **2.315.000.000** |
| *Penyesuaian/efisiensi & paket prototipe (aset awal ±40%)* | *(−365.000.000)* |
| **TOTAL PENGEMBANGAN (indikatif, sebelum PPN)** | **± 1.950.000.000** |

### 5.7 Pemeliharaan & Operasional (per tahun, mulai Tahun ke-2)

| Item | Estimasi/tahun |
|---|---:|
| Infrastruktur & lisensi (hosting, WA API, TTE, AI, SSL) | 240.000.000 |
| Dukungan & SLA (helpdesk, bugfix, patch keamanan, monitoring) — ± 20% nilai pengembangan inti | 180.000.000 |
| Pengembangan minor & penyempurnaan fitur (man-day pool) | 60.000.000 |
| **TOTAL PEMELIHARAAN / TAHUN** | **± 480.000.000** |

---

## 6. Dua Skema Komersial

KPU dapat memilih skema sesuai mekanisme anggaran (belanja modal vs. belanja barang/jasa):

### Skema 1 — Beli Putus (Lisensi Instansi) + Pemeliharaan
- **Tahun 1:** Rp 1.950.000.000 (pengembangan, termasuk infrastruktur Th-1)
- **Tahun 2 dst.:** Rp 480.000.000 / tahun (pemeliharaan & operasional)
- **Total 3 tahun:** ± **Rp 2.910.000.000**
- Cocok bila KPU ingin **kepemilikan aset & kode** serta hosting di lingkungan sendiri/PDN.

### Skema 2 — Langganan SaaS Tahunan (Managed)
- **Biaya implementasi awal (onboarding 28 tenant + integrasi):** Rp 750.000.000
- **Langganan terkelola:** Rp 720.000.000 / tahun (sudah termasuk hosting, lisensi, SLA, update)
- **Total 3 tahun:** ± **Rp 2.910.000.000**
- Cocok bila KPU ingin **belanja operasional (OPEX)**, tanpa mengelola infrastruktur sendiri.

> Kedua skema bernilai setara dalam 3 tahun; perbedaannya pada **struktur anggaran** (CAPEX vs OPEX)
> dan **siapa yang mengelola operasional**. Diskon dimungkinkan untuk komitmen multi-tahun.

---

## 7. Asumsi, Risiko & Faktor Sukses

**Asumsi**
- "SIPLENO" adalah nama produk/platform yang ditawarkan (bukan sistem KPU pusat yang sudah ada).
  Bila SIPLENO merujuk sistem nasional yang sudah berjalan, lingkup berubah menjadi **integrasi**
  dan anggaran disesuaikan (lihat risiko di bawah).
- Data, peran, dan SOP pleno 27 kabkota dapat distandarkan dalam satu skema.
- TTE menggunakan BSrE (gratis instansi) atau penyelenggara komersial sesuai kebijakan KPU.
- Hosting di PDN/cloud pemerintah tersedia dan kapasitasnya memadai.

**Risiko utama & mitigasi**
- *Tumpang tindih dengan sistem nasional (Sirekap/aplikasi KPU pusat)* → lakukan F0 Discovery untuk
  pastikan SIPLENO sebagai **pelengkap pemantauan internal**, bukan duplikasi; sediakan jalur integrasi.
- *Kepatuhan & keamanan data pemilu* → pentest wajib, audit SPBE/PDP, enkripsi, audit trail.
- *Adopsi 27 kabkota beragam kapasitas SDM* → ToT, e-learning, hypercare, mode offline-first.
- *Konektivitas lapangan* → PWA offline + sinkronisasi.

**Faktor sukses**
- Dukungan pimpinan KPU Provinsi & pelibatan sekretariat kabkota sejak F0.
- Sponsor anggaran dan kepastian skema procurement (e-katalog/tender).

---

## 8. Langkah Selanjutnya

1. **Demo prototipe** ke KPU Provinsi Jabar (PWA siap dipakai hari ini).
2. **Klarifikasi lingkup SIPLENO** (produk baru vs. integrasi sistem eksisting) di sesi F0.
3. Penyusunan **KAK & HPS** bersama, lalu penyesuaian RAB final dokumen ini.
4. Penetapan **skema komersial** (beli putus vs. langganan) dan mekanisme pengadaan.

---

*Dokumen ini adalah draf penawaran indikatif untuk keperluan perencanaan dan negosiasi.
Seluruh angka bersifat estimasi dan tidak mengikat sampai dituangkan dalam kontrak resmi.*
