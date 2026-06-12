"""Deduplikasi near-duplicate dengan MinHash (Arsitektur 3.3)."""

from datasketch import MinHash, MinHashLSH


def _minhash(teks: str, num_perm: int = 128) -> MinHash:
    m = MinHash(num_perm=num_perm)
    for kata in set(teks.split()):
        m.update(kata.encode("utf-8"))
    return m


def saring_duplikat(dokumen: list[tuple[str, str]], ambang: float = 0.85) -> list[str]:
    """Terima [(id, teks_bersih)], kembalikan id yang lolos (unik).

    Dokumen yang near-duplicate dengan dokumen lebih awal dibuang —
    korpus mentah tetap utuh di object storage; dedup hanya menentukan
    dokumen mana yang masuk analisis.
    """
    lsh = MinHashLSH(threshold=ambang, num_perm=128)
    lolos: list[str] = []
    for id_dok, teks in dokumen:
        m = _minhash(teks)
        if lsh.query(m):
            continue
        lsh.insert(id_dok, m)
        lolos.append(id_dok)
    return lolos
