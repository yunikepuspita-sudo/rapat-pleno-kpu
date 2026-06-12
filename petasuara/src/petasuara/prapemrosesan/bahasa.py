"""Deteksi bahasa kasar (ID/Sunda/campuran) — heuristik leksikal v0.

Cukup untuk routing korpus fase pilot; ganti dengan model fastText/CLD3
saat presisi menuntut. Label: 'id', 'su', 'campuran', 'lainnya'.
"""

# Partikel ambigu lintas bahasa (di, ke, ka, ti, eta) sengaja tidak dipakai.
_PENANDA_SU = {
    "teu", "henteu", "abdi", "urang", "aya", "moal", "kumaha", "naon",
    "iyeu", "geus", "keur", "jeung", "mah", "atuh", "euy",
}
_PENANDA_ID = {
    "tidak", "yang", "dengan", "untuk", "sudah", "belum", "akan", "adalah",
    "ini", "itu", "dan", "dari", "saya", "kita", "kami",
}


def deteksi_bahasa(teks: str) -> str:
    kata = set(teks.lower().split())
    skor_su = len(kata & _PENANDA_SU)
    skor_id = len(kata & _PENANDA_ID)
    if skor_su == 0 and skor_id == 0:
        return "lainnya"
    if skor_su > 0 and skor_id > 0:
        return "campuran"
    return "su" if skor_su > skor_id else "id"
