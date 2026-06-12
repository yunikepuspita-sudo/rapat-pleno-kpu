"""Uji subsistem QC — jantung kendali mutu (Cetak Biru VI)."""

import pytest

from petasuara.qc import (
    StatusGerbang,
    benchmark_per_kelas,
    cohen_kappa,
    evaluasi_gerbang,
    macro_f1,
    persentase_kesepakatan,
)


def test_kappa_kesepakatan_sempurna():
    a = ["pos", "neg", "net", "pos"]
    assert cohen_kappa(a, list(a)) == pytest.approx(1.0)


def test_kappa_mengoreksi_kesepakatan_kebetulan():
    # Dua penilai yang selalu menjawab kelas mayoritas: po tinggi, kappa rendah.
    a = ["pos"] * 9 + ["neg"]
    b = ["pos"] * 10
    assert persentase_kesepakatan(a, b) == pytest.approx(0.9)
    assert cohen_kappa(a, b) == pytest.approx(0.0)


def test_kappa_contoh_klasik():
    # Contoh baku 2x2 (marginal 50/50): po=0.7, pe=0.5 -> kappa=0.4
    a = ["ya"] * 35 + ["ya"] * 15 + ["tidak"] * 15 + ["tidak"] * 35
    b = ["ya"] * 35 + ["tidak"] * 15 + ["ya"] * 15 + ["tidak"] * 35
    assert cohen_kappa(a, b) == pytest.approx(0.4, abs=1e-9)


def test_macro_f1_menghukum_kelas_minoritas_gagal():
    # Pelabel yang menyerah pada kelas minoritas: akurasi 90%, Macro F1 jeblok.
    gold = ["mayoritas"] * 90 + ["minoritas"] * 10
    pred = ["mayoritas"] * 100
    metrik = benchmark_per_kelas(gold, pred)
    akurasi = sum(g == p for g, p in zip(gold, pred)) / len(gold)
    assert akurasi == pytest.approx(0.9)
    assert macro_f1(metrik) < 0.5


def test_benchmark_per_kelas_sederhana():
    gold = ["a", "a", "b", "b"]
    pred = ["a", "b", "b", "b"]
    metrik = {m.kelas: m for m in benchmark_per_kelas(gold, pred)}
    assert metrik["a"].precision == pytest.approx(1.0)
    assert metrik["a"].recall == pytest.approx(0.5)
    assert metrik["b"].recall == pytest.approx(1.0)
    assert metrik["a"].dukungan == 2


def test_gerbang_tolak_tanpa_gold_standard_reliabel():
    metrik = benchmark_per_kelas(["a", "b"], ["a", "b"])  # sempurna
    # Sekalipun benchmark sempurna, kappa < 0.70 berarti gold tidak sah: TOLAK.
    assert evaluasi_gerbang(kappa=0.5, metrik=metrik) is StatusGerbang.TOLAK
    assert evaluasi_gerbang(kappa=None, metrik=metrik) is StatusGerbang.TOLAK


def test_gerbang_lulus_dan_indikatif():
    sempurna = benchmark_per_kelas(["a", "b", "c"], ["a", "b", "c"])
    assert evaluasi_gerbang(kappa=0.8, metrik=sempurna) is StatusGerbang.LULUS

    buruk = benchmark_per_kelas(["a"] * 9 + ["b"], ["a"] * 10)
    assert evaluasi_gerbang(kappa=0.8, metrik=buruk) is StatusGerbang.INDIKATIF
