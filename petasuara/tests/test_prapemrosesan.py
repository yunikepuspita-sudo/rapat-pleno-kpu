from pathlib import Path

from petasuara.prapemrosesan.bahasa import deteksi_bahasa
from petasuara.prapemrosesan.normalisasi import Normalisator

KAMUS = Path(__file__).resolve().parents[1] / "kamus" / "normalisasi-id-umum.yaml"


def test_normalisasi_slang_umum():
    n = Normalisator(KAMUS)
    assert n.normalisasi("gak tau yg mana") == "tidak tau yang mana"
    assert n.versi == "0.1.0"


def test_deteksi_bahasa():
    assert deteksi_bahasa("saya tidak akan datang ke acara ini") == "id"
    assert deteksi_bahasa("abdi teu acan aya di bumi euy") == "su"
    assert deteksi_bahasa("urang teu setuju dengan kebijakan ini") == "campuran"
