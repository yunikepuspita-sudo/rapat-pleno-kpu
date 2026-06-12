"""LLM-as-annotator untuk klasifikasi kuadran posisi pesan (Modul 2).

Pelajaran repo roshho dikodekan, bukan diimbau:
- prompt terversi di prompts/ (model_run.versi_prompt merujuk berkas);
- jawaban tanpa kuadran (null) dihormati — tidak dipaksa menebak;
- output WAJIB lewat gerbang QC (Macro F1 >= 0,75 thd gold standard)
  sebelum boleh dibaca Analytics API.
"""

import json
from dataclasses import dataclass
from pathlib import Path

KUADRAN = (
    "A_PENTING_BASIS_SENSITIF_LAWAN",
    "B_PENTING_BASIS_NETRAL",
    "C_AMAN_BASIS_MENARIK_SWING",
    "D_BERISIKO",
)


@dataclass
class HasilAnotasi:
    kuadran: str | None
    alasan_singkat: str
    keyakinan: float


def muat_prompt(versi_prompt: str, dir_prompts: str | Path = "prompts") -> str:
    return (Path(dir_prompts) / f"{versi_prompt}.md").read_text(encoding="utf-8")


def parse_jawaban(mentah: str) -> HasilAnotasi:
    """Parse jawaban JSON LLM secara defensif; jawaban rusak = anotasi gagal,
    bukan label tebakan."""
    try:
        data = json.loads(mentah)
        kuadran = data.get("kuadran")
        if kuadran is not None and kuadran not in KUADRAN:
            kuadran = None
        return HasilAnotasi(
            kuadran=kuadran,
            alasan_singkat=str(data.get("alasan_singkat", "")),
            keyakinan=float(data.get("keyakinan", 0.0)),
        )
    except (json.JSONDecodeError, TypeError, ValueError):
        return HasilAnotasi(kuadran=None, alasan_singkat="jawaban tidak valid", keyakinan=0.0)
