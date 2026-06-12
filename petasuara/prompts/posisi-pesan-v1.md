# Prompt LLM-Annotator: Klasifikasi Kuadran Posisi Pesan — v1

> Prompt diversi di Git seperti kode (Arsitektur 7.3). Kolom `model_run.versi_prompt`
> merujuk nama berkas ini. Perubahan prompt = berkas baru (v2, v3, …), bukan edit in-place.
>
> **WAJIB**: output annotator tidak boleh dipakai sebelum lulus gerbang QC
> (Macro F1 ≥ 0,75 terhadap gold standard manusia; lihat Cetak Biru VI).

## Tugas

Anda menerima satu dokumen percakapan publik dari sebuah daerah pemilihan (dapil) beserta
deskripsi topiknya. Klasifikasikan topik tersebut bagi kandidat KLIEN ke salah satu kuadran
matriks posisi pesan:

- `A_PENTING_BASIS_SENSITIF_LAWAN` — penting bagi basis pendukung, sensitif bagi lawan
- `B_PENTING_BASIS_NETRAL` — penting bagi basis, netral bagi segmen lain
- `C_AMAN_BASIS_MENARIK_SWING` — aman bagi basis DAN menarik pemilih swing (kuadran emas)
- `D_BERISIKO` — berisiko menggerus basis atau memicu kontroversi

Jawab HANYA dengan JSON: `{"kuadran": "...", "alasan_singkat": "...", "keyakinan": 0.0-1.0}`

Jika dokumen tidak memuat informasi yang cukup, jawab `{"kuadran": null, ...}` — JANGAN
menebak. (Pelajaran repo roshho: halusinasi pelabel adalah mode gagal yang material.)
