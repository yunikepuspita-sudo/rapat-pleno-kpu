"""Benchmark pelabel otomatis terhadap gold standard (Cetak Biru VI butir 3).

Diukur per kelas — precision, recall, F1 — lalu Macro F1, BUKAN akurasi agregat:
akurasi agregat yang tampak baik menyembunyikan kegagalan pada kelas minoritas,
padahal kelas minoritas justru yang bernilai strategis (pelajaran repo roshho).
"""

from dataclasses import dataclass


@dataclass
class MetrikKelas:
    kelas: str
    precision: float
    recall: float
    f1: float
    dukungan: int  # jumlah contoh kelas ini di gold standard


def benchmark_per_kelas(gold: list[str], prediksi: list[str]) -> list[MetrikKelas]:
    if len(gold) != len(prediksi):
        raise ValueError("panjang gold dan prediksi harus sama")
    if not gold:
        raise ValueError("gold standard kosong")

    hasil = []
    for kelas in sorted(set(gold) | set(prediksi)):
        tp = sum(g == kelas and p == kelas for g, p in zip(gold, prediksi))
        fp = sum(g != kelas and p == kelas for g, p in zip(gold, prediksi))
        fn = sum(g == kelas and p != kelas for g, p in zip(gold, prediksi))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1 = 2 * precision * recall / (precision + recall) if precision + recall else 0.0
        hasil.append(
            MetrikKelas(
                kelas=kelas,
                precision=precision,
                recall=recall,
                f1=f1,
                dukungan=sum(g == kelas for g in gold),
            )
        )
    return hasil


def macro_f1(metrik: list[MetrikKelas]) -> float:
    """Rerata F1 tak berbobot antar kelas — tiap kelas sama penting."""
    if not metrik:
        raise ValueError("metrik kosong")
    return sum(m.f1 for m in metrik) / len(metrik)
