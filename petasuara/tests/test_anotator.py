from petasuara.nlp.anotator import parse_jawaban


def test_parse_jawaban_valid():
    h = parse_jawaban('{"kuadran": "C_AMAN_BASIS_MENARIK_SWING", '
                      '"alasan_singkat": "x", "keyakinan": 0.8}')
    assert h.kuadran == "C_AMAN_BASIS_MENARIK_SWING"
    assert h.keyakinan == 0.8


def test_parse_jawaban_null_dihormati():
    # LLM yang menolak menebak adalah perilaku benar, bukan kegagalan.
    h = parse_jawaban('{"kuadran": null, "alasan_singkat": "info kurang", "keyakinan": 0.2}')
    assert h.kuadran is None


def test_parse_jawaban_rusak_tidak_jadi_label():
    assert parse_jawaban("bukan json").kuadran is None
    assert parse_jawaban('{"kuadran": "KELAS_NGAWUR"}').kuadran is None
