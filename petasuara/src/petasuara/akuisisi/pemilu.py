"""Impor data pemilu historis dari data publik KPU — sekali per siklus.

Mengisi tabel referensi: dapil (kode, tingkat, kursi, BPP) dan profil elektoral
historis untuk Modul 1 (Diagnostik). HANYA data publik agregat hasil pemilu;
tidak pernah menyentuh DPT atau data kependudukan non-publik (Cetak Biru 9.2).
"""

import csv
from pathlib import Path


def muat_hasil_pemilu_csv(path: str | Path) -> list[dict]:
    """Muat ekspor CSV hasil pemilu publik (perolehan per partai/caleg per dapil)."""
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))
