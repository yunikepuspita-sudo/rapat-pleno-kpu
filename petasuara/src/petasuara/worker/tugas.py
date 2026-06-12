"""Definisi tugas antrean: ingest, pra-proses, model run, generate laporan.

Scheduler cron memicu job berkala (ingest harian per dapil, monitoring mingguan
war room). Transkripsi A/V masuk antrean terpisah ('gpu') karena biaya komputasi.
"""

from redis import Redis
from rq import Queue

from petasuara.config import Pengaturan

ANTREAN_UMUM = "petasuara"
ANTREAN_GPU = "petasuara-gpu"


def buat_antrean(nama: str = ANTREAN_UMUM) -> Queue:
    pengaturan = Pengaturan()
    return Queue(nama, connection=Redis.from_url(pengaturan.redis_url))


def job_ingest_dapil(path_konfigurasi: str) -> None:
    """Jalankan semua konektor dapil; tulis JSONL mentah ke object storage
    (immutable, kunci dapil/sumber/tanggal) + baris `dokumen`."""
    raise NotImplementedError("Sprint 1-2")


def job_praproses(dapil_kode: str) -> None:
    """Normalisasi -> deteksi bahasa -> filter spam -> dedup MinHash;
    isi dokumen.teks_bersih dan dokumen.bahasa."""
    raise NotImplementedError("Sprint 3-4")


def job_model_run(dapil_kode: str, jenis: str) -> None:
    """Catat model_run (versi model/prompt/parameter) lalu eksekusi
    topik/sentimen/posisi; tulis hasil_dokumen. Status awal gerbang: TOLAK."""
    raise NotImplementedError("Sprint 3-6")


def job_generate_laporan(engagement_id: str, jenis: str) -> None:
    """Panggil mesin render Node.js/docx dengan data ber-gerbang LULUS."""
    raise NotImplementedError("Sprint 7-8")
