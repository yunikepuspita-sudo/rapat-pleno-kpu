"""Konektor media sosial — kerangka (Sprint 1–2: satu platform pertama).

Kebijakan tegas (Cetak Biru 5.1 / Arsitektur 3.1):
- API resmi bila tersedia; selain itu crawling patuh-ToS dengan rate-limit.
- Hanya konten PUBLIK akun kandidat (figur publik) & percakapan dapil.
- Tanpa data pribadi sensitif, tanpa scraping akun privat.
"""

from collections.abc import Iterator

from petasuara.akuisisi.base import DokumenMasuk, Konektor


class KonektorInstagram(Konektor):
    """Tarik posting publik via API resmi (Instagram Graph API utk akun klien
    sendiri; konten kandidat lain hanya dari permukaan publik yang sah)."""

    versi = "0.0.1"

    def tarik(self, dapil_kode: str, konfigurasi: dict) -> Iterator[DokumenMasuk]:
        raise NotImplementedError("Sprint 1–2: implementasi platform medsos pertama")
