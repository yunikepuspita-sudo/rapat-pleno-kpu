"""Pemicu generator laporan (Arsitektur 3.4).

Mesin render adalah generator Node.js/docx yang sudah operasional (repositori
terpisah); modul ini menyiapkan payload data dari Analytics API, memanggil mesin
render dengan template terversi (templates/laporan/), menyimpan hasil ke object
storage per engagement, dan mencatat baris `deliverable`.

Setiap laporan WAJIB memuat lampiran metodologi satu halaman (Cetak Biru VI):
sumber data, periode, ukuran korpus, model, metrik validasi.
"""
