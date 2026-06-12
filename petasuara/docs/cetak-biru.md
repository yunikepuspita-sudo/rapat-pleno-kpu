# Cetak Biru Produk — PetaSuara

**Layanan Konsultansi Analitik Kampanye untuk Calon Anggota Legislatif**
Dokumen Perencanaan Produk — Rahasia Internal
CV Dua Ribu Sembilan, Bandung — Versi 1.0, Juni 2026

> Konversi markdown dari `docs/asli/CetakBiruPetaSuara.docx` (sumber otoritatif).

## I. Ringkasan Eksekutif

PetaSuara (nama kerja) adalah produk konsultansi analitik kampanye berbasis natural language
processing (NLP) dan data analytics untuk calon anggota legislatif (caleg) di sistem
proporsional terbuka Indonesia. Produk ini menerjemahkan tiga sumber yang telah dikaji:
kerangka komparatif profesionalisasi kampanye Bowler dan Farrell (1992), pelajaran metodologis
pelabelan teks politik berbantuan LLM dari proyek Columbia Business School (repo roshho), dan
pipeline analitik deskriptif Mathaisel dan Comm (2021) yang direplikasi repo yonniechan — lalu
menggabungkannya dengan kapasitas teknis yang sudah terbangun: BERTopic, model bahasa Indonesia
(IndoBERT), protokol reliabilitas antar-penilai, dan mesin produksi konten.

Proposisi nilai inti: caleg di dapil yang sama bersaing terutama dengan rekan separtainya
sendiri, bukan hanya dengan partai lain. Hampir seluruh jasa konsultan politik Indonesia
menjual intuisi dan jaringan; sangat sedikit yang menjual bukti. PetaSuara menjual bukti:
peta topik percakapan dapil, posisi pesan kompetitor, sentimen publik terhadap kandidat,
dan rekomendasi pesan yang teruji secara empiris — dikemas dalam deliverable yang dapat
langsung dieksekusi tim kampanye.

Produk terdiri atas lima modul yang dapat dijual terpisah atau sebagai paket berjenjang
(Diagnostik, Strategi, War Room), dengan rentang harga Rp35–300 juta per engagement.
Bagian IX menetapkan pagar etika yang tidak dapat ditawar, termasuk firewall ketat terhadap
jabatan kepenyelenggara pemilu: produk hanya dioperasikan oleh entitas dan personel yang
bebas dari konflik kepentingan kelembagaan.

## II. Landasan Konseptual

### 2.1 Kerangka Bowler–Farrell: Tiga Lapis Kampanye

Bowler dan Farrell (1992) membangun kerangka komparatif lintas sistem yang menyusun analisis
kampanye dalam tiga lapis: (1) **lingkungan kampanye** — faktor sistemik seperti sistem
pemilu, regulasi dana kampanye, dan akses media; (2) **organisasi internal** — bagaimana
partai/kandidat menstrukturkan manajemen kampanye, riset, dan penggunaan konsultan
profesional; (3) **dimensi pemasaran** — penargetan pemilih, citra kandidat, dan umpan balik.

Dua temuan kunci relevan langsung: pertama, teknik kampanye modern bersifat lintas sistem,
sehingga adaptasi metode analitik ke konteks Indonesia secara konseptual sahih. Kedua, kasus
Finlandia (Sundberg & Hognabba, 1992) menunjukkan bahwa pada sistem proporsional daftar
terbuka, kampanye riil berlangsung melalui kelompok pendukung kandidat perorangan — analog
langsung dengan tim sukses caleg Indonesia. Inilah celah pasar produk: **analitik level
kandidat, bukan level partai**.

Kerangka Nimmo (1970) — manajemen, riset, komunikasi — menjadi peta modul produk: PetaSuara
mengisi fungsi riset dan memberi input terstruktur ke fungsi komunikasi, sementara fungsi
manajemen tetap pada tim kampanye klien.

### 2.2 Tiga Pelajaran dari Studi Empiris

1. **Sinyal lintas-segmen** (repo roshho/Columbia). Terdapat himpunan topik yang penting bagi
   pemilih luar basis tetapi tidak sensitif bagi basis sendiri. Mengirim sinyal pada topik
   tersebut menarik dukungan luar tanpa menggerus basis. Untuk caleg Indonesia: peta topik
   "aman-basis, menarik-swing" per dapil.
2. **Batas akurasi LLM sebagai pelabel** (repo roshho). LLM mencapai akurasi agregat memadai
   tetapi Macro F1 rendah pada klasifikasi politik bernuansa, dengan tingkat halusinasi yang
   material. Konsekuensi produk: setiap pelabelan otomatis wajib melalui protokol validasi
   manusia dengan reliabilitas antar-penilai terdokumentasi (Bagian V/VI).
3. **Pipeline analitik dasar** (Mathaisel & Comm, 2021; repo yonniechan). Alur korpus →
   topic modeling → analisis sentimen → time-series engagement terbukti replikabel dan
   menghasilkan perbandingan head-to-head yang mudah dikomunikasikan ke klien non-teknis.
   Produk meng-upgrade mesinnya: LDA → BERTopic, TextBlob → IndoBERT.

### 2.3 Penerjemahan ke Konteks Proporsional Terbuka Indonesia

| Konsep sumber | Konteks asal | Adaptasi PetaSuara |
|---|---|---|
| Kampanye terpusat partai (Bowler & Farrell) | Eropa Barat, daftar tertutup | Analitik dua arah: posisi caleg terhadap narasi partai DAN terhadap caleg separtai se-dapil |
| Bipartisan signaling (roshho) | AS, dua partai | Peta sinyal lintas-segmen pemilih (nasionalis–religius, urban–rural, basis–swing) per dapil |
| Story arc dua kandidat (Mathaisel & Comm) | Pilpres AS, head-to-head | Benchmark multi-kandidat: seluruh caleg petahana dan penantang utama satu dapil |
| Korpus Twitter/X | Data Kaggle 2016 | Instagram, TikTok (caption + transkrip), Facebook, berita lokal, podcast/YouTube lokal |

## III. Posisi Pasar dan Segmen Klien

Pasar konsultan politik Indonesia menjelang Pemilu 2029 terbagi tiga lapis: lembaga survei
besar (tiket masuk ratusan juta–miliaran), konsultan media sosial/buzzer yang menjual
amplifikasi tanpa riset, dan **ruang kosong di tengah**: caleg DPRD provinsi, DPR RI, dan
DPRD kabupaten/kota papan atas dengan anggaran riset Rp30–300 juta yang tidak terlayani
analitik berbasis bukti. Diferensiasi: metodologi akademik yang dapat dipertanggungjawabkan,
harga di bawah lembaga survei besar (berbasis data digital publik), dan deliverable
eksekusi-siap.

### 3.1 Segmen Prioritas

| Segmen | Anggaran kampanye tipikal | Paket yang cocok | Kanal akuisisi |
|---|---|---|---|
| Caleg DPR RI petahana/penantang kuat | Rp1–5 miliar+ | Strategi + War Room | Referensi jaringan, tim resmi partai |
| Caleg DPRD provinsi | Rp500 juta – 2 miliar | Diagnostik + Strategi | Asosiasi profesi, alumni, partai tingkat provinsi |
| Caleg DPRD kab/kota papan atas | Rp200 juta – 1 miliar | Diagnostik | — |
| Paket kolektif per partai per dapil | Partai (DPD/DPW), variatif | Lisensi multi-dapil + pelatihan | Kemitraan kelembagaan |

Catatan strategis: penjualan kolektif kepada DPD/DPW partai (satu kontrak, banyak caleg)
menurunkan biaya akuisisi dan menetralkan sensitivitas "membantu satu caleg melawan caleg
separtai" — analitik diberikan setara kepada semua.

## IV. Arsitektur Produk: Lima Modul

Modul mengikuti tiga lapis Bowler–Farrell: Modul 1 membaca lingkungan, Modul 2–3 membekali
organisasi kampanye dengan riset, Modul 4–5 mengeksekusi dimensi pemasaran.

### Modul 1 — Diagnostik Dapil (Baseline)

Membaca lingkungan kampanye satu dapil secara menyeluruh sebelum strategi disusun:
profil elektoral historis (perolehan suara per partai/caleg dua pemilu terakhir, kursi
marginal, BPP, pola limpahan suara antar-caleg separtai); demografi dan geografi pemilih;
peta kompetitor (kekuatan digital awal, jejak pemberitaan lokal).
**Output:** Laporan Diagnostik Dapil (40–60 hal) + dashboard ringkas + sesi presentasi 2 jam.

### Modul 2 — Intelijen Pesan (Inti NLP)

Inti diferensiasi produk. Korpus percakapan publik dapil diolah menjadi:

- **Peta topik dapil (BERTopic):** topik yang benar-benar diperbincangkan pemilih — bukan
  asumsi tim sukses. Tiap topik: label manusiawi, volume, tren waktu, sebaran geografis.
- **Matriks posisi pesan:** tiap topik diklasifikasikan ke kuadran (a) penting-basis &
  sensitif-lawan, (b) penting-basis & netral, (c) aman-basis & menarik-swing, (d) berisiko.
  Kuadran (c) adalah ladang emas pesan kampanye.
- **Sentimen per kandidat per topik (IndoBERT):** bahan positioning dan attack/defense brief.

**Output:** Peta Topik Dapil + Matriks Posisi Pesan + rekomendasi 5–7 tema pesan prioritas.

### Modul 3 — Benchmark Kompetitif

Upgrade pipeline Mathaisel–Comm ke multi-kandidat: perbandingan diksi, topik dominan,
sentimen, story arc naratif, dan pola engagement seluruh kandidat kunci satu dapil —
termasuk caleg separtai. **Output:** Laporan Benchmark per kuartal (pra-kampanye) atau
per bulan (masa kampanye).

### Modul 4 — War Room Monitoring (Masa Kampanye)

Monitoring mingguan: pergeseran topik, lonjakan sentimen negatif (deteksi dini isu/serangan),
performa konten klien vs kompetitor. Brief mingguan 4–6 halaman + sesi daring 1 jam;
eskalasi darurat 1×24 jam untuk krisis. Uji pesan cepat (A/B testing organik).

### Modul 5 — Validasi Survei (Opsional, Bermitra)

Temuan analitik digital divalidasi dengan survei pemilih dapil sebelum keputusan anggaran
besar. Dikerjakan bermitra dengan lembaga survei lokal terdaftar; PetaSuara mendesain
instrumen dan menganalisis hasil. Menjembatani bias representasi pengguna media sosial.

## V. Pipeline Teknis dan Tumpukan Teknologi

### 5.1 Empat Lapis Pipeline

| Lapis | Komponen | Keterangan |
|---|---|---|
| Akuisisi data | Scraper Instagram/TikTok/Facebook publik (API resmi bila tersedia, crawling patuh-ToS), RSS berita lokal, transkripsi audio-video (Whisper), arsip hasil pemilu KPU (data publik) | Hanya data publik; tanpa data pribadi sensitif; log sumber per dokumen untuk auditabilitas |
| Pra-pemrosesan | Pembersihan teks ID informal (normalisasi slang, deduplikasi), deteksi bahasa (ID/Sunda/campuran), filter bot/spam | Kamus normalisasi per wilayah dibangun bertahap menjadi aset |
| Analitik NLP | BERTopic (embedding multibahasa/IndoBERT) untuk topik; IndoBERT fine-tuned untuk sentimen; LLM-as-annotator untuk klasifikasi posisi pesan dengan validasi manusia | Repurposing mesin yang sudah teruji, bukan pembangunan dari nol |
| Penyajian | Dashboard (HTML interaktif/web app ringan), laporan DOCX/PDF otomatis (Node.js/docx), deck presentasi, brief mingguan | Memanfaatkan mesin produksi dokumen yang sudah operasional |

### 5.2 Prinsip Arsitektur

- **Satu pipeline, banyak dapil:** kode dan model dibangun sekali, dijalankan per dapil
  dengan konfigurasi — biaya marginal per klien rendah.
- **Provenance:** setiap angka dapat ditelusuri ke dokumen sumber.
- **Aset kumulatif:** model dan kamus per wilayah; dapil kedua di Jawa Barat lebih murah
  dikerjakan daripada dapil pertama.

## VI. Metodologi Validasi dan Kendali Mutu

Pelajaran terpenting dari eksperimen Columbia adalah negatif: LLM tidak boleh dipercaya
mentah-mentah sebagai pelabel teks politik. Protokol kendali mutu:

1. **Gold standard manusia.** Per dapil, sampel acak berstrata (minimal 300–500 dokumen)
   dilabeli dua penilai independen; ketidaksepakatan diadjudikasi penilai ketiga.
2. **Reliabilitas terdokumentasi.** Cohen's κ atau Krippendorff's α ≥ 0,70 antar-penilai
   sebelum gold standard dipakai; di bawah ambang, rubrik direvisi dan diulang.
3. **Benchmark LLM per tugas.** Precision, recall, Macro F1 per kelas — bukan akurasi
   agregat. Ambang rilis: **Macro F1 ≥ 0,75** untuk klasifikasi yang dipakai dalam
   rekomendasi strategis; di bawahnya hasil hanya disajikan sebagai *indikatif* dengan
   label eksplisit.
4. **Koherensi topik.** BERTopic diaudit dengan skor koherensi dan inspeksi manusia atas
   dokumen representatif sebelum label final.
5. **Transparansi AI.** Setiap laporan memuat lampiran metodologi satu halaman: sumber data,
   periode, ukuran korpus, model, metrik validasi.

## VII. Paket Layanan, Deliverable, dan Harga

| Paket | Isi | Deliverable utama | Harga indikatif |
|---|---|---|---|
| DIAGNOSTIK | Modul 1 + Modul 2 satu kali | Laporan Diagnostik Dapil, Peta Topik, Matriks Posisi Pesan, 1 sesi presentasi | Rp35–60 juta |
| STRATEGI | Diagnostik + Modul 3 (2 siklus) + workshop pesan | + Laporan Benchmark + Playbook Pesan (tema, angle, kalender konten 3 bulan) | Rp90–150 juta |
| WAR ROOM | Strategi + Modul 4 (75 hari) + opsi Modul 5 | + brief mingguan, monitoring krisis, uji pesan; survei validasi terpisah | Rp200–300 juta + survei at-cost |
| LISENSI PARTAI | Diagnostik kolektif multi-dapil DPD/DPW + pelatihan | Laporan per dapil format seragam + 2 hari pelatihan | Negosiasi (diskon 30–40% per dapil) |

Pembayaran: 50% di muka, 40% saat deliverable utama, 10% setelah serah-terima. Kontrak:
jasa adalah analitik dan rekomendasi — bukan jaminan keterpilihan; klien dilarang
menggunakan output untuk kampanye hitam, disinformasi, atau pelanggaran peraturan kampanye,
dengan hak pemutusan sepihak.

## VIII. Operasional, Tim, dan Linimasa Engagement

### 8.1 Struktur Tim Minimum

| Peran | Tanggung jawab | Status |
|---|---|---|
| Direktur riset/metodologi | Desain riset, kendali mutu, validasi, tanda tangan metodologis | 1 orang (inti) |
| Analis NLP/data engineer | Pipeline akuisisi–pemrosesan–model, dashboard | 1–2 orang (inti) |
| Anotator/penilai | Pelabelan gold standard, audit topik | 2–3 lepas per proyek |
| Penghubung klien/strategis | Presentasi, workshop pesan, brief mingguan | 1 orang (dapat dirangkap) |
| Mitra survei | Pengumpulan data lapangan Modul 5 | Kemitraan per proyek |

### 8.2 Linimasa Engagement Tipikal (Paket Strategi)

| Pekan | Kegiatan |
|---|---|
| 1 | Kickoff, penetapan dapil dan daftar kandidat benchmark, mulai akuisisi data |
| 2–3 | Pra-pemrosesan korpus, pembangunan gold standard, kalibrasi pelabel |
| 4–5 | Analisis topik, sentimen, posisi pesan; drafting laporan diagnostik |
| 6 | Presentasi diagnostik + workshop pesan |
| 7–8 | Playbook Pesan dan kalender konten; serah-terima |
| Berkala | Siklus benchmark ulang per 4–6 minggu |

Kapasitas fase awal: 3–4 engagement Diagnostik paralel, atau 2 Strategi, atau
1 War Room + 1 Diagnostik.

## IX. Etika, Netralitas, dan Kepatuhan Hukum

Bagian ini bukan pelengkap, melainkan prasyarat keberadaan produk.

### 9.1 Firewall Kepenyelenggara Pemilu

Produk ini **tidak dapat dioperasikan, dimiliki sahamnya secara aktif, atau dikonsultani
oleh siapa pun yang sedang menjabat pada penyelenggara pemilu** (KPU, Bawaslu, DKPP) di
tingkat mana pun, termasuk pegawai sekretariat. UU No. 7/2017 dan kode etik penyelenggara
pemilu mensyaratkan netralitas; keterlibatan personel penyelenggara dalam jasa pemenangan
caleg adalah pelanggaran etik berat. Konsekuensi desain: cetak biru ini disiapkan sebagai
**aset dorman** atau dialihkan kepemilikan-operasinya sepenuhnya kepada pihak ketiga
independen, dan baru dapat dioperasikan setelah yang bersangkutan tidak lagi berstatus
pegawai/pejabat penyelenggara pemilu. Alternatif sah selama masa jabatan: memutar produk
180 derajat menjadi layanan non-pemenangan — analitik literasi pemilih, riset akademik,
atau jasa untuk media dan lembaga riset.

### 9.2 Perlindungan Data Pribadi

- Kepatuhan UU No. 27/2022 (PDP): hanya data publik; tanpa profiling individu pemilih;
  agregasi minimal level kelurahan/kecamatan; tanpa jual-beli data pemilih.
- Tidak menyentuh DPT atau data kependudukan non-publik dalam bentuk apa pun.

### 9.3 Integritas Kampanye

- Larangan kontraktual penggunaan output untuk disinformasi, kampanye hitam, politik
  identitas yang melanggar peraturan, atau operasi buzzer terkoordinasi.
- Tidak melayani dua caleg yang bersaing langsung pada dapil dan partai yang sama, kecuali
  melalui skema lisensi partai yang setara untuk semua.
- Lampiran metodologi terbuka pada setiap laporan; kesediaan diaudit pihak ketiga.

## X. Peta Jalan Pengembangan

| Fase | Fokus | Tonggak |
|---|---|---|
| Fase 0 (sekarang) | Aset dorman: dokumentasi pipeline, template laporan, kamus normalisasi, studi pilot non-pemenangan | 1 studi pilot terpublikasi; cetak biru final |
| Fase 1 | Aktivasi komersial (pasca syarat 9.1): 2–3 klien Diagnostik satu provinsi | 3 engagement selesai; testimoni; margin terverifikasi |
| Fase 2 | Skala: lisensi partai multi-dapil, otomasi laporan penuh, perekrutan analis | 10+ dapil; dashboard self-service v1 |
| Fase 3 | Produk berulang: langganan monitoring antar-pemilu untuk anggota terpilih | Pendapatan berulang > 40% |

Fase 3 adalah kunci keberlanjutan: pasar pemenangan musiman lima tahunan, tetapi kebutuhan
anggota terpilih memahami konstituennya permanen — dan secara etis jauh lebih bersih.

## Referensi

- Agranoff, R. (1976). *The new style in election campaigns* (2nd ed.). Holbrook Press.
- Bowler, S., & Farrell, D. M. (Eds.). (1992). *Electoral strategies and political marketing*. Macmillan.
- Grootendorst, M. (2022). BERTopic: Neural topic modeling with a class-based TF-IDF procedure. arXiv. https://doi.org/10.48550/arXiv.2203.05794
- Koto, F., Rahimi, A., Lau, J. H., & Baldwin, T. (2020). IndoLEM and IndoBERT. *COLING 2020*, 757–770. https://doi.org/10.18653/v1/2020.coling-main.66
- Mathaisel, D. F. X., & Comm, C. L. (2021). Political marketing with data analytics. *Journal of Marketing Analytics, 9*(1), 56–64. https://doi.org/10.1057/s41270-020-00097-1
- Nimmo, D. (1970). *The political persuaders*. Prentice-Hall.
- Sundberg, J., & Hognabba, S. (1992). Finland: The 1991 campaign. Dalam Bowler & Farrell (Eds.), 82–99.
- UU RI No. 7 Tahun 2017 tentang Pemilihan Umum.
- UU RI No. 27 Tahun 2022 tentang Pelindungan Data Pribadi.
