"""Analytics API — permukaan API Bagian V dokumen arsitektur.

Kontrak yang tidak boleh dilanggar:
1. Hanya membaca view `hasil_tersaji` (gerbang QC LULUS/INDIKATIF) — tidak
   pernah `hasil_dokumen` langsung; INDIKATIF selalu membawa flag peringatan.
2. Respons selalu menyertakan metadata provenance (model_run, versi, periode).
3. Token per tenant dengan cakupan engagement: klien tidak pernah menerima
   data dapil di luar kontraknya, sekalipun dapilnya sama dengan klien lain.
"""

from uuid import UUID

from fastapi import Depends, FastAPI, Header, HTTPException

app = FastAPI(title="PetaSuara Analytics API", version="0.1.0")


async def otorisasi_tenant(authorization: str = Header(...)) -> dict:
    """Validasi token per tenant; kembalikan klaim {tenant_id, engagement_ids,
    dapil_ids}. Implementasi penuh: token opaque di tabel + cache Redis."""
    raise HTTPException(status_code=501, detail="autentikasi tenant belum diimplementasikan")


def _wajib_akses_dapil(klaim: dict, dapil_id: UUID) -> None:
    if str(dapil_id) not in klaim.get("dapil_ids", []):
        # 404, bukan 403: keberadaan engagement lain pun tidak boleh bocor.
        raise HTTPException(status_code=404)


@app.get("/dapil/{dapil_id}/topik")
async def peta_topik(dapil_id: UUID, periode: str | None = None,
                     klaim: dict = Depends(otorisasi_tenant)):
    """Peta topik + tren. Konsumen: portal, generator laporan."""
    _wajib_akses_dapil(klaim, dapil_id)
    raise HTTPException(status_code=501, detail="Sprint 5-6")


@app.get("/dapil/{dapil_id}/matriks-posisi")
async def matriks_posisi(dapil_id: UUID, klaim: dict = Depends(otorisasi_tenant)):
    """Kuadran posisi pesan per topik. Konsumen: portal, laporan."""
    _wajib_akses_dapil(klaim, dapil_id)
    raise HTTPException(status_code=501, detail="Sprint 5-6")


@app.get("/dapil/{dapil_id}/benchmark")
async def benchmark(dapil_id: UUID, kandidat: str | None = None,
                    klaim: dict = Depends(otorisasi_tenant)):
    """Perbandingan multi-kandidat: diksi, topik, sentimen, engagement."""
    _wajib_akses_dapil(klaim, dapil_id)
    raise HTTPException(status_code=501, detail="Sprint 11-12")


@app.get("/dapil/{dapil_id}/timeseries")
async def timeseries(dapil_id: UUID, metrik: str,
                     klaim: dict = Depends(otorisasi_tenant)):
    """Deret waktu sentimen/volume/engagement. Konsumen: portal, alert."""
    _wajib_akses_dapil(klaim, dapil_id)
    raise HTTPException(status_code=501, detail="Sprint 9-10")


@app.get("/alert/{engagement_id}")
async def alert(engagement_id: UUID, klaim: dict = Depends(otorisasi_tenant)):
    """Lonjakan sentimen negatif & isu baru (war room)."""
    raise HTTPException(status_code=501, detail="Sprint 9-10")


@app.post("/laporan/{engagement_id}/{jenis}")
async def picu_laporan(engagement_id: UUID, jenis: str,
                       klaim: dict = Depends(otorisasi_tenant)):
    """Picu generate deliverable dari template. Konsumen: konsol internal, scheduler."""
    raise HTTPException(status_code=501, detail="Sprint 7-8")


@app.get("/provenance/{hasil_id}")
async def provenance(hasil_id: UUID, klaim: dict = Depends(otorisasi_tenant)):
    """Telusur hasil → model run → dokumen → sumber → waktu pengambilan."""
    raise HTTPException(status_code=501, detail="Sprint 11-12")
