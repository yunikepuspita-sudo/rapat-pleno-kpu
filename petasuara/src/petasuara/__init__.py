"""PetaSuara — platform analitik kampanye berbasis NLP (modular monolith).

Batas modul (Arsitektur I): akuisisi, prapemrosesan, nlp, qc, analytics,
laporan, worker. Komunikasi antar-modul lewat basis data dan antrean —
bukan import silang lapisan.
"""

__version__ = "0.1.0"
