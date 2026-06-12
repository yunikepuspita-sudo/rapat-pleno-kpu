"""Reliabilitas antar-penilai untuk gold standard (Cetak Biru VI butir 1–2).

Ambang: Cohen's kappa >= 0,70 antar dua penilai manusia sebelum gold standard
dipakai; di bawah itu rubrik pelabelan direvisi dan pelabelan diulang.
"""

from collections import Counter


def persentase_kesepakatan(a: list[str], b: list[str]) -> float:
    _validasi(a, b)
    return sum(x == y for x, y in zip(a, b)) / len(a)


def cohen_kappa(a: list[str], b: list[str]) -> float:
    """Cohen's kappa nominal untuk dua penilai."""
    _validasi(a, b)
    n = len(a)
    po = persentase_kesepakatan(a, b)
    freq_a, freq_b = Counter(a), Counter(b)
    pe = sum(freq_a[k] * freq_b[k] for k in freq_a.keys() | freq_b.keys()) / (n * n)
    if pe == 1.0:
        return 1.0
    return (po - pe) / (1 - pe)


def _validasi(a: list[str], b: list[str]) -> None:
    if len(a) != len(b):
        raise ValueError("panjang label dua penilai harus sama")
    if not a:
        raise ValueError("daftar label kosong")
