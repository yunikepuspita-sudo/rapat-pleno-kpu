"""Antarmuka seragam konektor — satu konektor per platform (Arsitektur 3.1)."""

import hashlib
from abc import ABC, abstractmethod
from collections.abc import Iterator
from datetime import datetime, timezone

from pydantic import BaseModel, Field


class DokumenMasuk(BaseModel):
    """Satu dokumen publik + provenance lengkap (fondasi auditabilitas)."""

    dapil_kode: str
    sumber_platform: str
    url: str | None = None
    waktu_terbit: datetime | None = None
    waktu_ambil: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    versi_konektor: str
    teks_mentah: str
    metadata: dict = {}

    @property
    def hash(self) -> str:
        return hashlib.sha256(self.teks_mentah.encode("utf-8")).hexdigest()


class Konektor(ABC):
    """Kontrak konektor: tarik konten publik terjadwal, patuh ToS + rate-limit.

    Implementasi WAJIB: (1) hanya konten publik, (2) hormati robots.txt/ToS dan
    rate-limit platform, (3) isi seluruh medan provenance DokumenMasuk.
    """

    versi: str = "0.0.0"

    @abstractmethod
    def tarik(self, dapil_kode: str, konfigurasi: dict) -> Iterator[DokumenMasuk]:
        """Hasilkan dokumen mentah; penyimpanan (JSONL ke object storage +
        baris tabel `dokumen`) diurus worker, bukan konektor."""
