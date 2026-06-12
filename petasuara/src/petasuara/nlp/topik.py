"""BERTopic service: peta topik per dapil per periode (Modul 2)."""

from dataclasses import dataclass, field


@dataclass
class HasilTopik:
    topik_id: int
    kata_kunci: list[str]
    volume: int
    koherensi: float | None
    dokumen_representatif: list[str]
    # Label final WAJIB manusia setelah inspeksi dokumen representatif
    # (Cetak Biru VI butir 4) — bukan output model.
    label_manusia: str | None = None


@dataclass
class ParameterRunTopik:
    versi_model: str = "bertopic-0.16+indobert-base"
    embedding_model: str = "firqaaa/indo-sentence-bert-base"
    min_topic_size: int = 15
    parameter_ekstra: dict = field(default_factory=dict)


def jalankan_topik(teks: list[str], param: ParameterRunTopik) -> list[HasilTopik]:
    """Latih BERTopic pada korpus bersih satu dapil-periode.

    Import di dalam fungsi agar modul ini tetap bisa di-import tanpa extras [nlp].
    Hasil + parameter run disimpan utuh (tabel model_run + topik).
    """
    from bertopic import BERTopic
    from sentence_transformers import SentenceTransformer

    embedder = SentenceTransformer(param.embedding_model)
    model = BERTopic(
        embedding_model=embedder,
        min_topic_size=param.min_topic_size,
        calculate_probabilities=False,
        **param.parameter_ekstra,
    )
    topik_ids, _ = model.fit_transform(teks)

    hasil: list[HasilTopik] = []
    for tid in sorted(set(topik_ids)):
        if tid == -1:  # outlier BERTopic
            continue
        info = model.get_topic(tid) or []
        hasil.append(
            HasilTopik(
                topik_id=tid,
                kata_kunci=[kata for kata, _ in info[:10]],
                volume=int(sum(1 for t in topik_ids if t == tid)),
                koherensi=None,  # diisi tahap audit koherensi terpisah
                dokumen_representatif=model.get_representative_docs(tid)[:5],
            )
        )
    return hasil
