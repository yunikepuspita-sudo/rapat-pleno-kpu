"""Lapis akuisisi data (Arsitektur 3.1).

Hanya data publik; tanpa data pribadi sensitif. Setiap dokumen masuk membawa
provenance lengkap: sumber, URL, waktu ambil, hash konten, versi konektor.
"""

from petasuara.akuisisi.base import DokumenMasuk, Konektor

__all__ = ["DokumenMasuk", "Konektor"]
