"""Transkripsi A/V → teks korpus (faster-whisper, GPU per-batch).

Antrean terpisah dari ingest teks karena biaya komputasi (Arsitektur 3.1):
job dikumpulkan lalu dieksekusi saat node GPU sewaan menyala.
"""

from collections.abc import Iterator

from petasuara.akuisisi.base import DokumenMasuk, Konektor


class KonektorTranskripsi(Konektor):
    versi = "0.0.1"

    def tarik(self, dapil_kode: str, konfigurasi: dict) -> Iterator[DokumenMasuk]:
        # Alur: unduh audio publik -> faster_whisper.WhisperModel(...).transcribe
        # -> DokumenMasuk(teks_mentah=transkrip, metadata={"durasi": ..., "kanal": ...})
        raise NotImplementedError("Membutuhkan node GPU; lihat extras [nlp]")
