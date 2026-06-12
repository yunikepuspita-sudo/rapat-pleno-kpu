"""Sentimen per dokumen per kandidat-target — IndoBERT fine-tuned (Modul 2/3).

Versi model dicatat per hasil (model_run.versi_model). Output mengalir ke
hasil_dokumen dan TIDAK tersaji sebelum gerbang QC LULUS.
"""

from dataclasses import dataclass

LABEL_SENTIMEN = ("negatif", "netral", "positif")


@dataclass
class HasilSentimen:
    label: str
    skor: float  # probabilitas label terpilih


def buat_pipeline_sentimen(versi_model: str):
    """Muat pipeline klasifikasi sentimen IndoBERT (extras [nlp])."""
    from transformers import pipeline

    return pipeline("text-classification", model=versi_model, truncation=True)


def skor_sentimen(pipe, teks: list[str]) -> list[HasilSentimen]:
    return [HasilSentimen(label=h["label"].lower(), skor=float(h["score"])) for h in pipe(teks)]
