# Arsitektur Aplikasi — PetaSuara

**Dokumen Arsitektur Teknis — Platform Konsultansi Analitik Kampanye**
Pendamping Cetak Biru Produk v1.0 — Rahasia Internal
CV Dua Ribu Sembilan, Bandung — Versi 1.0, Juni 2026

> Konversi markdown dari `docs/asli/ArsitekturAplikasiPetaSuara.docx` (sumber otoritatif).

## I. Prinsip Arsitektur

1. **Modular monolith dulu, microservices nanti.** Fase 0–1 dilayani satu codebase dengan
   batas modul tegas (akuisisi, NLP, QC, pelaporan, portal). Pemecahan hanya jika beban
   nyata menuntut. Tim 2–3 orang tidak boleh menanggung kompleksitas microservices.
2. **Dapil sebagai unit kerja, klien sebagai unit isolasi.** Pipeline berjalan per dapil;
   hak akses dipagari per klien (tenant). Satu dapil melayani banyak klien tanpa duplikasi
   komputasi — sumber margin terbesar.
3. **Provenance menyeluruh.** Hasil → model run → dokumen → sumber → waktu pengambilan.
   Bukan fitur; lisensi kredibilitas produk.
4. **Gerbang QC sebagai arsitektur, bukan prosedur.** Hasil klasifikasi otomatis secara
   teknis tidak dapat mengalir ke laporan klien sebelum status gerbang validasi
   (Macro F1 ≥ ambang) terpenuhi di basis data.
5. **Pipeline = aset, laporan = produk.** Kamus, model fine-tuned, gold standard, template
   laporan terversi di repositori.
6. **Privasi sejak desain.** Tidak ada tabel individu pemilih. Kepatuhan UU PDP tertanam
   di skema data, bukan di kebijakan.

## II. Gambaran Arsitektur

Empat lapis mengalir searah — **akuisisi → penyimpanan → pemrosesan → penyajian** — dengan
satu pengecualian disengaja: **Subsistem QC berdiri di antara pemrosesan dan penyajian
sebagai gerbang**. Komponen lintas-lapis (autentikasi, audit, scheduler, observabilitas)
melayani semua lapis.

## III. Spesifikasi Komponen per Lapis

### 3.1 Lapis Akuisisi Data

| Komponen | Fungsi | Implementasi |
|---|---|---|
| Konektor media sosial | Tarik konten publik akun kandidat & percakapan dapil terjadwal; simpan mentah + metadata | Python; API resmi bila tersedia, crawler patuh-ToS dengan rate-limit; satu konektor per platform di balik antarmuka seragam |
| Konektor berita lokal | RSS + scraper portal berita dapil; deteksi artikel menyebut kandidat | Python (feedparser, trafilatura); daftar sumber per dapil di konfigurasi |
| Transkripsi A/V | Transkrip podcast, YouTube, reels lokal menjadi teks korpus | faster-whisper di GPU sewaan per-batch; antrean terpisah karena biaya komputasi |
| Data pemilu | Hasil pemilu historis, struktur dapil, BPP | Impor sekali per siklus dari data publik KPU; tabel referensi |
| Impor survei (Modul 5) | Muat hasil survei mitra ke skema analisis | Template CSV/XLSX terstandar + validator |

Setiap dokumen masuk dicatat dengan: **sumber, URL, waktu ambil, hash konten, versi
konektor** — fondasi provenance.

### 3.2 Lapis Penyimpanan dan Antrean

| Komponen | Isi | Implementasi |
|---|---|---|
| Object storage | Korpus mentah immutable (JSONL per batch), media, transkrip, artefak model | S3-compatible (Cloudflare R2/MinIO); kunci: `dapil/sumber/tanggal` |
| PostgreSQL | Skema relasional inti (Bagian IV): tenant, engagement, dapil, kandidat, dokumen, label, hasil model, gerbang QC, audit | Satu instans terkelola; partisi tabel dokumen per dapil saat volume menuntut |
| Vector store | Embedding dokumen untuk BERTopic & pencarian semantik | pgvector di instans yang sama |
| Antrean tugas | Orkestrasi job: ingest, pra-proses, model run, generate laporan | Redis + RQ/Celery; scheduler cron untuk job berkala |

### 3.3 Lapis Pemrosesan NLP dan Kendali Mutu

| Komponen | Fungsi | Implementasi |
|---|---|---|
| Pra-pemrosesan | Normalisasi slang Indonesia/daerah, dedup near-duplicate, filter bot/spam, deteksi bahasa (ID/Sunda/campuran) | Python; kamus normalisasi terversi per wilayah; MinHash untuk dedup |
| BERTopic service | Topik per dapil per periode; tren volume; skor koherensi; dokumen representatif | BERTopic + embedding IndoBERT/multibahasa; hasil + parameter run disimpan utuh |
| Sentimen | Skor sentimen per dokumen per kandidat-target | IndoBERT fine-tuned domain politik lokal; versi model dicatat per hasil |
| LLM-annotator posisi pesan | Klasifikasi kuadran matriks posisi pesan | API LLM dengan prompt terversi; batch; output WAJIB lewat gerbang QC |
| Subsistem QC | UI pelabelan ganda + adjudikasi; hitung κ/α otomatis; benchmark Macro F1 per kelas; set status gerbang per (dapil, tugas, versi-model) | Web app internal sederhana (bisa Label Studio dikustom); tabel `qc_gate` dirujuk semua komponen hilir |

### 3.4 Lapis Analitik, Pelaporan, dan Portal

| Komponen | Fungsi | Implementasi |
|---|---|---|
| Analytics API | Matriks posisi pesan, benchmark multi-kandidat, time-series, deteksi lonjakan sentimen | FastAPI; hanya membaca hasil berstatus LULUS; respons selalu menyertakan metadata provenance |
| Generator laporan | Diagnostik, Benchmark, brief mingguan, lampiran metodologi — otomatis dari template | Node.js/docx; template terversi per jenis deliverable; render PDF |
| Portal klien | Login per tenant; dashboard; peta topik interaktif; unduh deliverable | Web app (React/HTML ringan); read-only terhadap Analytics API |
| Konsol internal | Admin tenant & engagement, pemicu/monitor pipeline, provenance explorer | Web app internal; akses terbatas peran ops/riset |

## IV. Model Data Inti

Skema PostgreSQL inti — implementasi: [`db/schema.sql`](../db/schema.sql).
Kolom audit `created_at`/`created_by` tersirat di semua tabel.

| Tabel | Kolom kunci | Catatan |
|---|---|---|
| tenant | id, nama, jenis (caleg/partai), status_kontrak | Unit isolasi akses |
| engagement | id, tenant_id, paket, dapil_id, periode, status | Satu kontrak = satu baris |
| dapil | id, kode, tingkat (RI/prov/kab-kota), provinsi, bpp, kursi | Unit kerja pipeline; dipakai bersama lintas tenant |
| kandidat | id, dapil_id, nama, partai, nomor_urut, status_petahana, akun_resmi (JSON) | Figur publik kontestan; bukan data pribadi sensitif |
| sumber | id, jenis, platform/media, url_dasar, konfigurasi | Registri konektor per dapil |
| dokumen | id, dapil_id, sumber_id, url, hash, waktu_terbit, waktu_ambil, teks_mentah, teks_bersih, bahasa | Partisi per dapil; immutable setelah masuk |
| model_run | id, jenis (topik/sentimen/posisi), versi_model, versi_prompt, parameter (JSON), dapil_id, periode | Reprodusibilitas penuh |
| hasil_dokumen | dokumen_id, model_run_id, label, skor, kandidat_target_id | Hasil granular per dokumen |
| topik | id, model_run_id, label_manusia, kata_kunci, volume, koherensi | Label final oleh manusia |
| gold_label | dokumen_id, tugas, penilai_id, label, ronde | Pelabelan ganda + adjudikasi |
| qc_gate | dapil_id, tugas, model_run_id, kappa, macro_f1 (JSON per kelas), status (LULUS/INDIKATIF/TOLAK), disetujui_oleh | Dirujuk Analytics API sebelum menyajikan hasil |
| deliverable | id, engagement_id, jenis, versi, path_objek, diserahkan_pada | Arsip kontraktual |
| audit_log | aktor, aksi, objek, waktu, detail (JSON) | Append-only |

**Aturan integritas terpenting:** `hasil_dokumen` hanya dapat dibaca Analytics API jika
`qc_gate.status = 'LULUS'` untuk kombinasi (dapil, tugas, model_run) terkait; status
`INDIKATIF` memaksa label peringatan eksplisit di seluruh penyajian.

## V. Permukaan API (Ringkas)

| Endpoint | Fungsi | Konsumen |
|---|---|---|
| `GET /dapil/{id}/topik?periode=` | Peta topik + tren | Portal, generator laporan |
| `GET /dapil/{id}/matriks-posisi` | Kuadran posisi pesan per topik | Portal, laporan |
| `GET /dapil/{id}/benchmark?kandidat=` | Perbandingan multi-kandidat: diksi, topik, sentimen, engagement | Portal, laporan |
| `GET /dapil/{id}/timeseries?metrik=` | Deret waktu sentimen/volume/engagement | Portal, alert |
| `GET /alert/{engagement}` | Lonjakan sentimen negatif & isu baru (war room) | Brief mingguan, notifikasi |
| `POST /laporan/{engagement}/{jenis}` | Picu generate deliverable dari template | Konsol internal, scheduler |
| `GET /provenance/{hasil_id}` | Telusur hasil → run → dokumen → sumber | Konsol, audit eksternal |

Semua endpoint memerlukan token per tenant dengan cakupan engagement; portal klien tidak
pernah menerima data dapil di luar kontraknya, sekalipun dapilnya sama dengan klien lain.

## VI. Keamanan, Multi-Tenancy, dan Kepatuhan

- **Isolasi tenant berlapis:** row-level security PostgreSQL (tenant_id/engagement_id) +
  cakupan token API + pemisahan folder object storage per engagement.
- **Konflik klien terkode:** constraint pada engagement menolak dua tenant aktif dengan
  kombinasi (dapil, partai) identik — aturan etika 9.3 Cetak Biru di level basis data.
- **Privasi:** tidak ada tabel individu pemilih; dokumen adalah konten publik; agregasi
  geografis minimum kelurahan; retensi korpus mentah maksimal 1 siklus pemilu lalu
  dianonimkan/dihapus sesuai kontrak.
- **Enkripsi & akses:** TLS menyeluruh, enkripsi at-rest, MFA konsol internal, hak akses
  minimum per peran (ops, analis, anotator, klien).
- **Audit:** audit_log append-only; provenance explorer untuk audit pihak ketiga.

## VII. Topologi Deployment dan Estimasi Biaya

### 7.1 Fase 0–1: Monolit Modular

- 1 VPS aplikasi (8 vCPU/16 GB): API, portal, konsol, worker antrean, PostgreSQL+pgvector.
- Object storage terkelola (R2/S3) — bayar per pakai.
- GPU sewaan per-batch (transkripsi Whisper, embedding, fine-tune) — menyala saat job saja.
- Estimasi: Rp3–7 juta/bulan di luar biaya API LLM (dianggarkan per engagement).

### 7.2 Fase 2: Skala

Pisahkan PostgreSQL ke instans terkelola; worker NLP ke node terpisah dengan autoscaling;
CDN untuk portal. Pemecahan layanan pertama yang masuk akal: worker NLP dan portal klien.

### 7.3 Lingkungan dan Alur Rilis

- Tiga lingkungan: dev, staging (dapil sintetis), produksi.
- Template laporan dan prompt LLM diversi di Git seperti kode.
- CI: uji unit pipeline + uji regresi pada korpus emas kecil (hasil model tidak boleh
  bergeser tanpa kenaikan versi run).

## VIII. Urutan Pembangunan (MVP → Lengkap)

| Sprint | Lingkup | Hasil bisa-dipakai |
|---|---|---|
| 1–2 | Skema PostgreSQL inti, konektor berita + 1 platform medsos, object storage, antrean | Korpus 1 dapil pilot mengalir harian |
| 3–4 | Pra-pemrosesan + BERTopic service + UI QC v0 (pelabelan ganda + κ) | Peta topik tervalidasi dapil pilot |
| 5–6 | Sentimen IndoBERT + LLM-annotator + gerbang QC penuh + Analytics API | Matriks posisi pesan pertama berstatus LULUS |
| 7–8 | Generator laporan (template Diagnostik) + konsol internal v1 | Deliverable Diagnostik end-to-end otomatis 70% |
| 9–10 | Portal klien v1 + brief mingguan terjadwal + alert | Siap Paket Strategi & uji War Room internal |
| 11–12 | Benchmark multi-kandidat penuh, pengerasan keamanan, provenance explorer | Platform v1.0 — siap aktivasi komersial Fase 1 |

Dua belas sprint dua-mingguan ≈ 6 bulan kalender dengan 1 engineer penuh + 1 paruh waktu —
selaras dengan Fase 0 (aset dorman): platform matang selama masa tunggu firewall etik, dan
studi pilot non-pemenangan (analitik percakapan publik untuk literasi pemilih) menjadi uji
beban produksi pertama.
