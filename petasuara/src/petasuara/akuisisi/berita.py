"""Konektor berita lokal: RSS + ekstraksi artikel (feedparser + trafilatura)."""

from collections.abc import Iterator
from datetime import datetime, timezone

import feedparser
import trafilatura

from petasuara.akuisisi.base import DokumenMasuk, Konektor


class KonektorBerita(Konektor):
    versi = "0.1.0"

    def tarik(self, dapil_kode: str, konfigurasi: dict) -> Iterator[DokumenMasuk]:
        for feed in konfigurasi.get("rss", []):
            parsed = feedparser.parse(feed["url"])
            for entri in parsed.entries:
                unduhan = trafilatura.fetch_url(entri.link)
                teks = trafilatura.extract(unduhan) if unduhan else None
                if not teks:
                    continue
                waktu_terbit = None
                if getattr(entri, "published_parsed", None):
                    waktu_terbit = datetime(*entri.published_parsed[:6], tzinfo=timezone.utc)
                yield DokumenMasuk(
                    dapil_kode=dapil_kode,
                    sumber_platform="berita-rss",
                    url=entri.link,
                    waktu_terbit=waktu_terbit,
                    versi_konektor=self.versi,
                    teks_mentah=teks,
                    metadata={"judul": getattr(entri, "title", None), "feed": feed["url"]},
                )


def sebut_kandidat(teks: str, nama_kandidat: list[str]) -> list[str]:
    """Deteksi sederhana artikel yang menyebut kandidat (Arsitektur 3.1)."""
    teks_lower = teks.lower()
    return [nama for nama in nama_kandidat if nama.lower() in teks_lower]
