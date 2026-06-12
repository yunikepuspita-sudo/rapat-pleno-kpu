"""Lapis pemrosesan NLP (Arsitektur 3.3).

Komponen berat (BERTopic, transformers) ada di extras [nlp] — dipasang di node
worker, bukan node API. Semua hasil dicatat sebagai model_run dengan versi model,
versi prompt, dan parameter penuh demi reprodusibilitas.
"""
