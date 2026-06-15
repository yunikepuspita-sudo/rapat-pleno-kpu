# Proposal Teknis & Anggaran (Skema Swakelola) — SIPLENO KPU Provinsi Jawa Barat

**Sistem Informasi Pleno (SIPLENO)** — Platform digitalisasi & pemantauan Rapat Pleno
terintegrasi untuk KPU Provinsi Jawa Barat dan **27 Kabupaten/Kota**, **dikembangkan secara
internal (swakelola) di atas server yang sudah dimiliki KPU**.

| | |
|---|---|
| **Pemilik kegiatan** | KPU Provinsi Jawa Barat |
| **Cakupan** | 1 KPU Provinsi + 27 KPU Kabupaten/Kota |
| **Skema pengadaan** | **Swakelola Tipe I** (dikerjakan & dikelola sendiri oleh KPU) |
| **Infrastruktur** | **Server/data center eksisting KPU** (tanpa belanja hosting baru) |
| **Basis** | Prototipe "Portal Rapat Pleno KPU" (PWA, sudah berjalan) |
| **Status dokumen** | Draf perencanaan — angka indikatif, final menyesuaikan RAB/SBM |
| **Tanggal** | Juni 2026 |

> Catatan: nominal bersifat **indikatif (estimasi)** untuk perencanaan. Angka final mengikuti
> **Standar Biaya Masukan (SBM)** Kemenkeu yang berlaku, ketersediaan SDM internal, dan
> kebijakan anggaran KPU. Dasar hukum swakelola: **Perpres 16/2018 jo. 12/2021** dan
> **Peraturan LKPP** tentang Swakelola.

---

## 1. Ringkasan Eksekutif

Prototipe yang sudah ada membuktikan **alur kerja pleno 9 tahap end-to-end** (persiapan →
undangan → presensi QR → pelaksanaan → notulensi AI → voting → Berita Acara → tanda tangan →
arsip) dalam bentuk **PWA satu-pengguna berbasis `localStorage`**. Karena kode, model data, dan
UI/UX sudah tersedia (≈ 40% dari produk akhir), pengembangan menjadi SIPLENO **sangat layak
dikerjakan secara swakelola** oleh tim teknis KPU, dibantu beberapa **tenaga ahli kontrak
perorangan** bila SDM internal belum cukup.

SIPLENO adalah **produktisasi** prototipe menjadi platform **multi-tenant** dengan:

1. **Backend & basis data terpusat** (server-backed, menggantikan `localStorage`) **di server KPU
   yang sudah ada**.
2. **Hierarki organisasi**: KPU Provinsi sebagai *pemantau*, 27 KPU Kabupaten/Kota sebagai
   *pelaksana* pleno.
3. **Dashboard Pemantauan Provinsi real-time**: status pleno, kuorum, progres, Berita Acara, dan
   tindak lanjut keputusan seluruh 27 kabkota dalam satu layar.
4. **Otentikasi & RBAC** berjenjang, **audit trail**, dan kepatuhan **SPBE/UU PDP**.
5. **Integrasi resmi**: TTE **BSrE (gratis untuk instansi pemerintah)**, WhatsApp Business API,
   notulensi AI, dan single sign-on.

**Estimasi biaya swakelola: ± Rp 880 juta (satu kali)** + **± Rp 175 juta/tahun** operasional &
pemeliharaan — jauh lebih hemat dibanding skema penyedia karena **tanpa margin penyedia, tanpa PPN
penyedia, dan memanfaatkan server serta SDM yang sudah ada** (lihat Bagian 5–6).

---

## 2. Kondisi Prototipe Saat Ini (baseline)

| Aspek | Kondisi prototipe | Implikasi untuk produksi swakelola |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite, PWA (installable, offline) | **Dipertahankan** — aset utama, tinggal disambungkan ke API |
| Penyimpanan | `localStorage` per-perangkat | **Diganti** backend terpusat + sinkronisasi offline |
| Multi-instansi | Tidak ada (single-tenant) | **Dibangun** model 28 tenant berjenjang |
| Otentikasi | "Login" lokal sekadar penanda perangkat | **Dibangun** auth + RBAC + SSO |
| Pemantauan | Dashboard tindak lanjut 1 instansi | **Dibangun** dashboard agregasi 27 kabkota |
| AI notulensi | Supabase Edge Function (Claude) opsional | **Dipertahankan**; bisa dipindah ke server KPU |
| Tanda tangan | Penanda boolean (belum legal) | **Diintegrasikan** TTE BSrE (gratis instansi) |
| Undangan WA | Click-to-chat (manual) | **Ditingkatkan** ke WhatsApp Business API |
| Hosting | GitHub Pages (statis) | **Dipindah ke server/data center KPU yang sudah ada** |
| Keamanan | Belum ada (demo publik) | **Pentest, hardening, audit** (dapat via BSSN) |

**Kesimpulan:** ± 40% nilai produk (alur kerja, UI/UX, model data, generator BA/notulensi) sudah
tersedia. Pekerjaan inti swakelola = **lapisan backend, multi-tenant, pemantauan, keamanan, dan
integrasi resmi**, di atas infrastruktur yang sudah dimiliki.

---

## 3. Arsitektur Target SIPLENO (di server eksisting KPU)

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
   │  BACKEND SIPLENO — di SERVER/DATA CENTER KPU YANG SUDAH ADA                │
   │  API + Auth/RBAC + DB multi-tenant + Storage + Realtime                   │
   │  Integrasi: TTE BSrE • WhatsApp Business API • Email • AI Notulensi • SSO  │
   └──────────────────────────────────────────────────────────────────────────┘
```

**Komponen yang dibangun (memanfaatkan stack open-source agar tanpa biaya lisensi):**

- **API & basis data multi-tenant** — PostgreSQL (open-source) dengan isolasi per tenant
  (Row-Level Security), 28 tenant; skema mengikuti model data prototipe (`Rapat`, `Peserta`,
  `Voting`, `BeritaAcara`, `TindakLanjut`, dst.). Di-deploy di **server KPU eksisting**
  (mis. via container/Docker).
- **Otentikasi & RBAC berjenjang** — peran: Super Admin (provinsi), Admin Kabkota, Komisioner
  (Ketua/Anggota), Sekretariat, Operator, dan **Pemantau Provinsi** (akses baca lintas wilayah).
  Gunakan komponen open-source (mis. Keycloak/Supabase self-hosted) — **tanpa lisensi berbayar**.
- **Dashboard Pemantauan Provinsi** — peta & tabel 27 kabkota: jumlah pleno, status kuorum,
  progres Berita Acara, SLA tindak lanjut; ekspor laporan.
- **Sinkronisasi offline-first** — PWA tetap berfungsi saat jaringan tidak stabil, lalu sinkron.
- **Integrasi resmi** — TTE **BSrE** (gratis instansi), WhatsApp Business API, email, notulensi AI.
- **Keamanan & kepatuhan** — enkripsi at-rest & in-transit, audit log, sesuai **SPBE** dan
  **UU 27/2022 (PDP)**; pentest dapat dikoordinasikan dengan **BSSN**.

> **Prasyarat server eksisting** (perlu dikonfirmasi di F0): kapasitas compute/RAM/storage,
> OS & dukungan container, backup, jalur publik ber-SSL/domain `.go.id`, dan akses ke 27 kabkota.
> Bila kapasitas kurang, ada kebutuhan upgrade resource minor (dianggarkan kecil di Komponen B).

---

## 4. Roadmap Teknis (7 fase, ± 7–9 bulan)

> Durasi sedikit lebih panjang dari skema penyedia karena tim swakelola umumnya **paruh waktu**
> (merangkap tugas rutin). Dapat dipercepat bila tenaga ahli kontrak bekerja penuh waktu.

| Fase | Durasi | Fokus | Keluaran (deliverable) |
|---|---|---|---|
| **F0 — Discovery & Audit Server** | 3–4 mgg | Kebutuhan 27 kabkota, **audit kapasitas server eksisting**, arsitektur final | SRS, desain arsitektur, hasil audit server, rencana keamanan, backlog |
| **F1 — Fondasi Backend & Multi-tenant** | 6–8 mgg | API, DB PostgreSQL + RLS, 28 tenant, migrasi model data, deploy ke server KPU | Backend MVP di server KPU, skema DB, CI/CD, lingkungan dev/staging |
| **F2 — RBAC, Auth & Migrasi Frontend** | 5–6 mgg | SSO, peran berjenjang, audit log; sambung PWA ke API | Login & otorisasi, PWA tersambung backend, sinkronisasi offline |
| **F3 — Dashboard Pemantauan Provinsi** | 4 mgg | Agregasi real-time 27 kabkota, laporan, ekspor | Dashboard provinsi, modul laporan & ekspor PDF/Excel |
| **F4 — Integrasi Resmi** | 5 mgg | TTE BSrE, WhatsApp Business API, email, AI notulensi | BA bertanda tangan legal, notifikasi resmi, notulensi AI |
| **F5 — Keamanan, UAT & Hardening** | 4–5 mgg | Pentest (BSSN/internal), perbaikan, UAT bersama KPU | Laporan pentest + remediasi, BAUT, dokumen operasional |
| **F6 — Pelatihan, Go-Live & Hypercare** | 4 mgg | ToT, rollout 27 kabkota, pendampingan | Pelatihan selesai, sistem produksi, hypercare 30 hari |

---

## 5. Rincian Anggaran Swakelola (RAB)

> Semua nilai dalam Rupiah, **indikatif** untuk perencanaan. Honorarium mengikuti **SBM** yang
> berlaku. Karena swakelola: **tidak ada margin penyedia & PPN penyedia**, server **eksisting**,
> dan beberapa layanan pemerintah (**TTE BSrE, pentest BSSN**) **gratis/koordinatif**.

### 5.1 Komponen A — Tenaga Ahli Kontrak Perorangan (individu)
*Untuk menutup kebutuhan teknis yang belum tersedia di internal. Tarif tanpa margin perusahaan.*

| Peran | Honor/bulan | Alokasi (bln) | Subtotal |
|---|---:|---:|---:|
| Lead Developer / Arsitek Sistem | 22.000.000 | 8 | 176.000.000 |
| Backend Engineer | 18.000.000 | 7 | 126.000.000 |
| Frontend Engineer | 17.000.000 | 7 | 119.000.000 |
| DevOps / SRE (paruh waktu) | 18.000.000 | 4 | 72.000.000 |
| UI/UX Designer (paruh waktu) | 15.000.000 | 3 | 45.000.000 |
| **Subtotal Tenaga Ahli** | | | **538.000.000** |

### 5.2 Komponen B — Honorarium Tim Swakelola (staf internal KPU)
*Tim Persiapan, Tim Pelaksana, dan Tim Pengawas — honor per SBM, di luar gaji rutin.*

| Item | Estimasi |
|---|---:|
| Honor Tim Persiapan, Pelaksana & Pengawas (± 10 orang, sesuai SBM) | 110.000.000 |
| Koordinator/PM kegiatan (internal) | included |
| **Subtotal Honorarium Tim** | **110.000.000** |

### 5.3 Komponen C — Infrastruktur (memakai server eksisting)

| Item | Estimasi |
|---|---:|
| Hosting/server | **Rp 0** (server & data center KPU sudah ada) |
| Upgrade resource minor bila perlu (RAM/storage/backup) — cadangan | 25.000.000 |
| Domain `.go.id` & sertifikat SSL | 5.000.000 |
| Tools monitoring/logging (open-source self-hosted) | 0 |
| **Subtotal Infrastruktur** | **30.000.000** |

### 5.4 Komponen D — Lisensi & Layanan Pihak Ketiga (Tahun ke-1)

| Item | Estimasi |
|---|---:|
| TTE tersertifikasi — **BSrE/BSSN** | **Rp 0** (gratis untuk instansi pemerintah) |
| WhatsApp Business API (BSP + biaya percakapan) | 30.000.000 |
| AI Notulensi (token Claude API, sesuai volume rapat) | 24.000.000 |
| Penetration test — dikoordinasikan dengan **BSSN** atau pihak ketiga (cadangan) | 50.000.000 |
| **Subtotal Lisensi & Pihak Ketiga** | **104.000.000** |

> Bila TTE memilih penyelenggara komersial (mis. Privy/Peruri) dan pentest via vendor, biaya
> bertambah; bila sepenuhnya memakai layanan pemerintah, bisa **mendekati Rp 30 juta** saja.

### 5.5 Komponen E — Pelatihan & Rollout 27 Kabkota

| Item | Estimasi |
|---|---:|
| Paket meeting/bimtek regional + konsumsi (beberapa batch, manfaatkan rakor) | 60.000.000 |
| Perjalanan dinas tim (pendampingan & ToT) | 50.000.000 |
| Materi pelatihan, e-learning & video panduan (dibuat internal) | 10.000.000 |
| **Subtotal Pelatihan & Rollout** | **120.000.000** |

### 5.6 Komponen F — Operasional Kegiatan & Kontingensi

| Item | Estimasi |
|---|---:|
| Rapat koordinasi, ATK, penggandaan, dokumentasi | 25.000.000 |
| Kontingensi / cadangan risiko (± 6%) | 53.000.000 |
| **Subtotal** | **78.000.000** |

### 5.7 Rekapitulasi Biaya Swakelola (satu kali)

| Komponen | Nilai |
|---|---:|
| A. Tenaga Ahli Kontrak Perorangan | 538.000.000 |
| B. Honorarium Tim Swakelola (internal) | 110.000.000 |
| C. Infrastruktur (server eksisting) | 30.000.000 |
| D. Lisensi & Pihak Ketiga (Th-1) | 104.000.000 |
| E. Pelatihan & Rollout 27 kabkota | 120.000.000 |
| F. Operasional & Kontingensi | 78.000.000 |
| **TOTAL SWAKELOLA (indikatif)** | **± 880.000.000** |

> **Skenario hemat maksimal** (SDM internal mencukupi sehingga tenaga ahli minimal, TTE BSrE,
> pentest BSSN): biaya dapat ditekan ke kisaran **± Rp 350–450 juta**, didominasi honorarium tim,
> perjalanan dinas, dan langganan API.

### 5.8 Pemeliharaan & Operasional (per tahun, mulai Tahun ke-2)

| Item | Estimasi/tahun |
|---|---:|
| Server eksisting (operasional rutin, sudah ditanggung KPU) | Rp 0 / minimal |
| WhatsApp Business API | 30.000.000 |
| AI Notulensi (token) | 24.000.000 |
| Domain/SSL & cadangan upgrade resource | 11.000.000 |
| Honor tim pemeliharaan/dukungan internal (helpdesk, patch, bugfix) | 90.000.000 |
| Penyempurnaan fitur minor (man-day pool tenaga ahli) | 20.000.000 |
| **TOTAL PEMELIHARAAN / TAHUN** | **± 175.000.000** |

---

## 6. Perbandingan Skema & Catatan Swakelola

| Aspek | Skema Penyedia (tender) | **Skema Swakelola (pilihan ini)** |
|---|---:|---:|
| Biaya pengembangan (satu kali) | ± Rp 1,95 miliar | **± Rp 880 juta** |
| Pemeliharaan / tahun | ± Rp 480 juta | **± Rp 175 juta** |
| Margin penyedia & PPN penyedia | Ada | **Tidak ada** |
| Hosting | Cloud/PDN (berbayar) | **Server KPU eksisting (Rp 0)** |
| Kepemilikan kode | Tergantung kontrak | **Penuh milik KPU** |
| Ketergantungan SDM internal | Rendah | **Tinggi** (perlu tim & komitmen) |

**Keuntungan swakelola:** biaya jauh lebih rendah, **kepemilikan kode & data penuh**, kendali
penuh, dan penguatan kapasitas SDM internal KPU.

**Konsekuensi yang harus dikelola:** swakelola menuntut **komitmen SDM internal** dan tata kelola
proyek yang disiplin. Bila kapasitas internal terbatas, pertimbangkan **Swakelola Tipe II**
(kerja sama dengan instansi pemerintah lain, mis. **perguruan tinggi negeri / BRIN / Diskominfo
provinsi**) untuk sebagian pekerjaan teknis, tetap tanpa margin komersial.

---

## 7. Asumsi, Risiko & Faktor Sukses

**Asumsi**
- Skema **Swakelola Tipe I** (dikerjakan internal KPU); SDM inti tersedia atau dilengkapi tenaga
  ahli kontrak perorangan.
- **Server/data center KPU eksisting** memiliki kapasitas, OS, dukungan container, backup, dan
  jalur publik ber-SSL yang memadai (**diverifikasi di F0 — Audit Server**).
- TTE memakai **BSrE** (gratis instansi); pentest dapat via **BSSN**.
- "SIPLENO" adalah platform internal KPU Jabar untuk pemantauan pleno (bukan duplikasi sistem
  nasional). Bila merujuk sistem pusat yang ada, lingkup berubah menjadi **integrasi**.

**Risiko utama & mitigasi**
- *Kapasitas server eksisting kurang* → audit di F0; siapkan cadangan upgrade resource minor.
- *Ketergantungan & ketersediaan SDM internal* → kontrak tenaga ahli perorangan + opsi Swakelola
  Tipe II dengan PTN/BRIN; dokumentasikan kode agar tidak bergantung individu.
- *Kepatuhan & keamanan data pemilu* → pentest (BSSN), audit SPBE/PDP, enkripsi, audit trail.
- *Adopsi 27 kabkota beragam kapasitas* → ToT, e-learning, hypercare, mode offline-first.

**Faktor sukses**
- Penetapan **Tim Swakelola** (SK) dengan peran & tanggung jawab jelas sejak F0.
- Dukungan pimpinan KPU Provinsi & komitmen sekretariat 27 kabkota.
- Kepastian alokasi anggaran (honorarium SBM, perjalanan dinas, langganan API) dalam DIPA.

---

## 8. Langkah Selanjutnya

1. **Demo prototipe** ke pimpinan KPU Provinsi Jabar (PWA siap dipakai hari ini).
2. **Audit server eksisting** & klarifikasi lingkup SIPLENO (F0).
3. Penetapan **Tim Swakelola** (SK) + penyusunan **KAK swakelola & RAB final** berbasis SBM.
4. Pengadaan **tenaga ahli kontrak perorangan** dan langganan layanan (WA API, AI) sesuai aturan.

---

## Lampiran A — Opsi Anggaran Terbatas Rp 50 Juta (MVP/Pilot)

Bila pagu hanya **± Rp 50 juta** (≈ 6% paket swakelola penuh), target berubah dari "sistem
produksi 27 kabkota" menjadi **MVP/Pilot percontohan** yang membuktikan nilai inti —
*backend multi-tenant + Dashboard Pemantauan Provinsi* — dengan memaksimalkan **server eksisting,
fitur prototipe yang sudah ada, dan layanan gratis pemerintah**.

### A.1 Penyesuaian lingkup

| Komponen | Paket swakelola Rp 880 jt | Penyesuaian di Rp 50 jt |
|---|---|---|
| Tim | 5 tenaga ahli + 10 staf | **1 fullstack dev kontrak** + koordinator & 2 staf internal |
| TTE legal (BSrE) | Diintegrasikan | **Ditunda** — pakai penanda TTE prototipe |
| WhatsApp Business API | Rp 30 jt | **Ditunda** — pakai *click-to-chat* prototipe (Rp 0) |
| AI notulensi berbayar | Rp 24 jt | **Generator lokal** prototipe (Rp 0); token AI minimal opsional |
| Pentest formal | Rp 50 jt | **Ditunda** — hardening checklist internal + koordinasi BSSN |
| Pelatihan tatap muka 27 kabkota | Rp 120 jt | **Bimtek daring + video panduan** |
| Cakupan rollout | 27 kabkota penuh | **3–5 kabkota percontohan** dulu |

### A.2 Prioritas (MoSCoW)

- **MUST:** (1) Backend + DB multi-tenant (PostgreSQL self-hosted di server KPU) pengganti
  `localStorage`; (2) Auth + RBAC dasar 2 level (Pemantau Provinsi & Operator Kabkota);
  (3) **Dashboard Pemantauan Provinsi** — agregasi status pleno/kuorum/BA/tindak lanjut;
  (4) Migrasi PWA → API untuk modul inti; (5) Deploy ke server eksisting.
- **SHOULD:** ekspor laporan provinsi (PDF/Excel), audit log dasar.
- **WON'T (fase lanjutan):** TTE legal, WA Business API, AI berbayar, pentest formal, SSO,
  sinkronisasi offline lanjutan, rollout penuh 27 kabkota.

### A.3 RAB Rp 50 juta

| Item | Estimasi |
|---|---:|
| Tenaga ahli fullstack (kontrak) — Rp 18 jt × 2 bln | 36.000.000 |
| Honor tim internal (koordinator + 2 staf, SBM ringkas) | 6.000.000 |
| Token AI notulensi (opsional, minimal) | 2.000.000 |
| Domain `.go.id` & SSL (Rp 0 bila pakai subdomain KPU) | 2.000.000 |
| Operasional, rapat daring, ATK | 2.000.000 |
| Kontingensi | 2.000.000 |
| **TOTAL** | **50.000.000** |

### A.4 Ekspektasi & strategi

MVP fungsional dalam **± 2–3 bulan**: sudah dapat memantau kabkota percontohan secara real-time
untuk demo ke pimpinan. Karena **fondasi multi-tenant sudah terbangun**, *scale-up* ke 27 kabkota
pada fase berikutnya tinggal konfigurasi + biaya pelatihan/integrasi — **bukan bangun ulang**.
Pendekatan pilot ini efektif sebagai **bukti nilai untuk mengamankan anggaran lanjutan**.

---

*Dokumen ini adalah draf perencanaan indikatif untuk skema swakelola. Seluruh angka bersifat
estimasi mengikuti SBM dan kebijakan anggaran KPU, dan tidak mengikat sampai dituangkan dalam
dokumen kegiatan resmi.*
