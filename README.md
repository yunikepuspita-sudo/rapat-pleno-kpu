# 🗳️ Portal Rapat Pleno KPU

Aplikasi **PWA (Progressive Web App)** untuk **alur kerja Rapat Pleno KPU secara digital end-to-end** —
mulai dari perencanaan rapat, distribusi undangan, presensi QR, pelaksanaan (hybrid), pengambilan
keputusan (voting elektronik), notulensi otomatis berbasis AI, penerbitan **Berita Acara (BA) Pleno**,
tanda tangan elektronik, hingga arsip & monitoring tindak lanjut.

Terinspirasi arsitektur aplikasi rapat pleno terintegrasi serta proyek open-source
[frappe/meeting](https://github.com/frappe/meeting). Mendukung prinsip kerja KPU yang
**paperless, akuntabel, transparan, terdokumentasi, dan terdigitalisasi penuh**.

> Proyek demonstrasi. Seluruh nama komisioner, nomor pleno, dan data bersifat fiktif/edukatif.

**🌐 Demo:** <https://yunikepuspita-sudo.github.io/rapat-pleno-kpu/>

## ✨ Fitur — 9 tahapan alur pleno

1. **Persiapan Rapat** — jadwalkan rapat: nomor pleno, agenda, jadwal, lokasi, moda (luring/daring/hybrid),
   tautan Zoom/Meet, daftar peserta & peran, serta bahan rapat.
2. **Distribusi Undangan** — naskah undangan otomatis, **broadcast WhatsApp** per peserta (click-to-chat),
   tautan **Google Calendar** (Add to Calendar), dan **Email** (mailto).
3. **Registrasi & Presensi** — **QR presensi** (di-generate luring); peserta memindai → check-in →
   **rekap kehadiran & status kuorum** otomatis. Tersedia juga penandaan manual (hadir/izin/tidak hadir).
4. **Pelaksanaan Rapat** — tautan conference (Zoom/Google Meet), bahan paparan, kontrol mulai/akhiri rapat,
   serta penanda recording (Zoom Recording) & transkripsi (Otter.ai).
5. **Notulensi Otomatis** — editor transkrip + **penyusun notulensi otomatis** (ringkasan, poin pembahasan,
   keputusan, tindak lanjut). Berjalan **luring** dengan generator lokal; opsional bertenaga **Claude**.
6. **Pengambilan Keputusan** — **voting elektronik** (gaya Mentimeter/Slido): buka/tutup voting, suara
   per peserta atau rahasia (anonim), **rekapitulasi & pemenang otomatis**.
7. **Penyusunan Berita Acara** — **BA Pleno disusun otomatis** dengan menggabungkan agenda, daftar hadir &
   kuorum, ringkasan notulensi, hasil voting, keputusan, dan tindak lanjut.
8. **Review & Penandatanganan** — alur status BA (draft → review → final) + **tanda tangan elektronik**
   per penandatangan (Ketua, Anggota, Sekretaris). Cetak/ekspor PDF lewat dialog cetak browser.
9. **Arsip & Knowledge Management** — repositori BA final & keputusan pleno dengan **pencarian**, plus
   **Dashboard monitoring tindak lanjut** keputusan lintas rapat.

## 🛠️ Teknologi

- **React 18** + **TypeScript** + **Vite**
- **PWA** via `vite-plugin-pwa` (installable, offline-ready, service worker auto-update)
- **React Router** (HashRouter — cocok untuk hosting statis seperti GitHub Pages)
- **qrcode** untuk pembuatan QR presensi secara luring
- **localStorage** sebagai penyimpanan utama → aplikasi berjalan penuh **tanpa backend**
- **Claude (Anthropic)** opsional via **Supabase Edge Function** (`pleno-ai`) untuk notulensi AI

## 🚀 Menjalankan

```bash
npm install      # pasang dependensi
npm run dev      # mode pengembangan (http://localhost:5173)
npm run build    # build produksi ke folder dist/
npm run preview  # pratinjau hasil build
```

Aplikasi langsung berisi **data contoh KPU** (2 rapat pleno) sehingga dapat dicoba seketika.
Atur ulang / kosongkan data dari menu **Setelan**.

## 🤖 Notulensi AI (opsional)

Tanpa konfigurasi apa pun, notulensi disusun oleh **generator lokal** (luring). Untuk hasil yang
lebih kaya dengan **Claude**:

1. Set `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY` di `.env` (lihat `.env.example`).
2. Deploy edge function: `supabase functions deploy pleno-ai --no-verify-jwt`.
3. Isi secret `ANTHROPIC_API_KEY` di Supabase. Kunci API **tidak pernah** ada di browser.

Selama AI belum aktif, UI otomatis memakai generator lokal — tidak ada fitur yang rusak.

## 📁 Struktur

```
src/
  main.tsx                 # entry + router (HashRouter)
  App.tsx                  # definisi rute
  index.css                # desain (tema biru KPU)
  components/              # Navbar, Modal, QrCode, StatusBadge, Markdown, InstallButton
  pleno/
    types.ts               # model data (Rapat, Peserta, Voting, BeritaAcara, …)
    store.ts               # store localStorage + hook usePleno() + aksi
    seed.ts                # data contoh bertema KPU
    utils.ts               # format tanggal, rekap presensi/voting, kuorum
    ai.ts                  # generator notulensi & penyusun Berita Acara (lokal + Claude)
    tabs/                  # TabRingkasan, TabUndangan, TabPresensi, TabPelaksanaan,
                           #   TabNotulensi, TabVoting, TabBeritaAcara
  pages/                   # Dashboard, RapatList, RapatForm, RapatDetail,
                           #   Hadir (check-in QR), Arsip, Pengaturan, NotFound
supabase/functions/pleno-ai/  # Edge Function notulensi AI (opsional)
```

## 🧭 Rute utama

| Rute | Halaman |
|------|---------|
| `/` | Beranda / Dashboard (portal & monitoring) |
| `/rapat` | Daftar rapat pleno |
| `/rapat/baru`, `/rapat/:id/edit` | Form persiapan rapat |
| `/rapat/:id` | Detail rapat (7 tab alur kerja) |
| `/hadir/:id` | Halaman check-in presensi (tujuan QR) |
| `/arsip` | Arsip Berita Acara & keputusan |
| `/pengaturan` | Profil lembaga & integrasi |
