"""Normalisasi teks Indonesia informal dengan kamus terversi per wilayah."""

import re
from pathlib import Path

import yaml

_TOKEN = re.compile(r"\w+|\S")


class Normalisator:
    def __init__(self, path_kamus: str | Path):
        with open(path_kamus, encoding="utf-8") as f:
            kamus = yaml.safe_load(f)
        self.versi: str = kamus["versi"]
        self.peta: dict[str, str] = {k.lower(): v for k, v in kamus["peta"].items()}

    def normalisasi(self, teks: str) -> str:
        token = _TOKEN.findall(teks.lower())
        return " ".join(self.peta.get(t, t) for t in token)
