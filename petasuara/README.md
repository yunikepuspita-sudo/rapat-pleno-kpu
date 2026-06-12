# PetaSuara

Platform konsultansi analitik kampanye berbasis NLP dan data analytics untuk calon anggota
legislatif pada sistem proporsional terbuka Indonesia.

> **Rahasia internal — CV Dua Ribu Sembilan, Bandung.**
> Repositori ini adalah implementasi *Fase 0 (aset dorman)* sesuai Cetak Biru Produk v1.0:
> platform dimatangkan selama masa tunggu firewall etik (Bagian IX Cetak Biru) dan hanya
> diaktivasi komersial setelah syarat Bagian 9.1 terpenuhi.

## Dokumen acuan

| Dokumen | Lokasi |
|---|---|
| Cetak Biru Produk v1.0 | [`docs/cetak-biru.md`](docs/cetak-biru.md) · asli: `docs/asli/CetakBiruPetaSuara.docx` |
| Arsitektur Aplikasi v1.0 | [`docs/arsitektur.md`](docs/arsitektur.md) · asli: `docs/asli/ArsitekturAplikasiPetaSuara.docx` |
| Referensi metodologi pipeline | [yonniechan/Political-marketing-with-data-analytics](https://github.com/yonniechan/Political-marketing-with-data-analytics) — replikasi Mathaisel & Comm (2021): korpus → topic modeling (LDA) → sentimen (TextBlob) → time-series engagement. PetaSuara meng-upgrade mesinnya: LDA → BERTopic, TextBlob → IndoBERT, head-to-head dua kandidat → benchmark multi-kandidat per dapil. |

## Enam prinsip arsitektur (ringkas)

1. **Modular monolith dulu, microservices nanti** — satu codebase, batas modul tegas.
2. **Dapil sebagai unit kerja, klien (tenant) sebagai unit isolasi** — satu dapil melayani
   banyak klien tanpa duplikasi komputasi.
3. **Provenance menyeluruh** — setiap angka dapat ditelusuri: hasil → model run → dokumen →
   sumber → waktu pengambilan.
4. **Gerbang QC sebagai arsitektur, bukan prosedur** — hasil klasifikasi otomatis secara
   teknis tidak bisa mengalir ke laporan sebelum `qc_gate.status = 'LULUS'`.
5. **Pipeline = aset, laporan = produk** — kamus normalisasi, model, gold standard, dan
   template laporan terversi di repositori ini.
6. **Privasi sejak desain** — tidak ada tabel individu pemilih; unit analisis terkecil
   adalah dokumen publik dan agregat wilayah (UU No. 27/2022 PDP).

## Tata letak repositori

```
petasuara/
├── docs/                  # Cetak biru & arsitektur (markdown + docx asli)
├── db/schema.sql          # Skema PostgreSQL inti + RLS + gerbang QC + constraint etika
├── configs/dapil/         # Konfigurasi per dapil (sumber, kandidat, kanal)
├── kamus/                 # Kamus normalisasi slang per wilayah (aset kumulatif, terversi)
├── prompts/               # Prompt LLM terversi (diversi di Git seperti kode)
├── templates/laporan/     # Template deliverable (Diagnostik, Benchmark, brief mingguan)
├── src/petasuara/
│   ├── akuisisi/          # Konektor: berita lokal, media sosial, transkripsi A/V, data pemilu
│   ├── prapemrosesan/     # Normalisasi slang, dedup MinHash, deteksi bahasa, filter spam
│   ├── nlp/               # BERTopic service, sentimen IndoBERT, LLM-annotator posisi pesan
│   ├── qc/                # Reliabilitas antar-penilai (κ/α), benchmark Macro F1, gerbang QC
│   ├── analytics/         # Analytics API (FastAPI) — hanya menyajikan hasil LULUS gerbang
│   ├── laporan/           # Pemicu generator laporan (mesin render: Node.js/docx terpisah)
│   └── worker/            # Tugas antrean (RQ): ingest, pra-proses, model run, laporan
└── tests/                 # Uji unit (QC dapat dijalankan tanpa dependensi berat)
```

## Menjalankan (pengembangan)

```bash
# Infrastruktur lokal: PostgreSQL+pgvector, Redis, MinIO
docker compose up -d

# Lingkungan Python
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"            # inti ringan
pip install -e ".[nlp]"            # + BERTopic, transformers, faster-whisper (berat, opsional)

# Skema basis data
psql "$DATABASE_URL" -f db/schema.sql

# Uji unit (modul QC murni-Python, jalan tanpa ekstra NLP)
pytest

# Analytics API
uvicorn petasuara.analytics.api:app --reload
```

## Urutan pembangunan (12 sprint dua-mingguan)

| Sprint | Lingkup | Status |
|---|---|---|
| 1–2 | Skema PostgreSQL, konektor berita + 1 medsos, object storage, antrean | ✅ kerangka di repo ini |
| 3–4 | Pra-pemrosesan + BERTopic service + UI QC v0 (pelabelan ganda + κ) | 🔲 kerangka modul tersedia |
| 5–6 | Sentimen IndoBERT + LLM-annotator + gerbang QC penuh + Analytics API | 🔲 kerangka modul tersedia |
| 7–8 | Generator laporan (template Diagnostik) + konsol internal v1 | 🔲 |
| 9–10 | Portal klien v1 + brief mingguan terjadwal + alert | 🔲 |
| 11–12 | Benchmark multi-kandidat penuh, pengerasan keamanan, provenance explorer | 🔲 |

## Pagar etika (tidak dapat ditawar)

Lihat Bagian IX Cetak Biru. Tiga pagar yang juga **dikodekan** di repo ini:

- **Firewall kepenyelenggara pemilu** — repositori ini berstatus aset dorman; tidak
  dioperasikan komersial oleh siapa pun yang berstatus pegawai/pejabat penyelenggara pemilu.
- **Privasi (UU PDP)** — skema data tidak memiliki tabel individu pemilih; agregasi geografis
  minimum kelurahan; lihat `db/schema.sql`.
- **Konflik klien** — constraint basis data menolak dua tenant aktif pada kombinasi
  (dapil, partai) identik di luar skema lisensi partai; lihat `db/schema.sql`.
