"""Logika status gerbang QC per (dapil, tugas, model_run).

Status (tabel qc_gate, Arsitektur IV):
- LULUS     — Macro F1 >= ambang rilis: hasil boleh dipakai dalam rekomendasi strategis.
- INDIKATIF — di bawah ambang: hasil hanya tersaji dengan label peringatan eksplisit.
- TOLAK     — gold standard belum sah (kappa < ambang) atau benchmark belum ada:
              hasil tidak boleh tersaji sama sekali.

Penegakan teknis ada di basis data (view hasil_tersaji) dan Analytics API;
modul ini menghitung status yang ditulis ke qc_gate.
"""

from enum import Enum

from petasuara.qc.benchmark import MetrikKelas, macro_f1


class StatusGerbang(str, Enum):
    LULUS = "LULUS"
    INDIKATIF = "INDIKATIF"
    TOLAK = "TOLAK"


def evaluasi_gerbang(
    kappa: float | None,
    metrik: list[MetrikKelas] | None,
    ambang_kappa: float = 0.70,
    ambang_macro_f1: float = 0.75,
) -> StatusGerbang:
    # Tanpa gold standard yang reliabel, benchmark tidak bermakna: TOLAK.
    if kappa is None or kappa < ambang_kappa:
        return StatusGerbang.TOLAK
    if not metrik:
        return StatusGerbang.TOLAK
    if macro_f1(metrik) >= ambang_macro_f1:
        return StatusGerbang.LULUS
    return StatusGerbang.INDIKATIF
