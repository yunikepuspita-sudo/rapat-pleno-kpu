"""Konfigurasi aplikasi & pemuat konfigurasi dapil."""

from pathlib import Path

import yaml
from pydantic import BaseModel
from pydantic_settings import BaseSettings


class Pengaturan(BaseSettings):
    database_url: str = "postgresql+psycopg://petasuara:petasuara-dev@localhost:5432/petasuara"
    redis_url: str = "redis://localhost:6379/0"

    s3_endpoint_url: str = "http://localhost:9000"
    s3_access_key: str = ""
    s3_secret_key: str = ""
    s3_bucket_korpus: str = "petasuara-korpus"
    s3_bucket_deliverable: str = "petasuara-deliverable"

    llm_api_key: str = ""
    llm_model: str = ""

    # Ambang gerbang QC (Cetak Biru VI). Menurunkan ambang = keputusan
    # metodologis direktur riset, bukan parameter tuning.
    qc_ambang_kappa: float = 0.70
    qc_ambang_macro_f1: float = 0.75

    class Config:
        env_file = ".env"


class KonfigurasiDapil(BaseModel):
    """Representasi configs/dapil/*.yaml — unit kerja pipeline."""

    kode: str
    tingkat: str
    provinsi: str
    kursi: int = 0
    bpp: int | None = None
    kandidat: list[dict] = []
    sumber: dict = {}
    kamus_normalisasi: str = "kamus/normalisasi-id-umum.yaml"


def muat_konfigurasi_dapil(path: str | Path) -> KonfigurasiDapil:
    with open(path, encoding="utf-8") as f:
        return KonfigurasiDapil.model_validate(yaml.safe_load(f))
