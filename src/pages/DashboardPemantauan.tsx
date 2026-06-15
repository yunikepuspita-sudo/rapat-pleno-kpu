// ──────────────────────────────────────────────────────────────────────────
// MVP SIPLENO — Dashboard Pemantauan Provinsi (inti nilai produk).
//
// KPU Provinsi Jawa Barat memantau status pleno 27 kabupaten/kota secara
// agregat: jumlah rapat, yang sedang berlangsung, selesai, Berita Acara final,
// kuorum terakhir, dan tindak lanjut keputusan yang masih tertunda.
// ──────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from 'react'
import { sumberPemantauan } from '../lib/pemantauan'
import {
  agregatProvinsi,
  tindakLanjutTertunda,
  type RekapWilayah,
} from '../pemantauan/agregasi'
import { formatTanggalSingkat } from '../pleno/utils'

type Urut = 'nama' | 'rapat' | 'tertunda'

export default function DashboardPemantauan() {
  const [rekap, setRekap] = useState<RekapWilayah[]>([])
  const [sumber, setSumber] = useState<'backend' | 'demo'>('demo')
  const [memuat, setMemuat] = useState(true)
  const [cari, setCari] = useState('')
  const [urut, setUrut] = useState<Urut>('nama')

  useEffect(() => {
    let batal = false
    sumberPemantauan()
      .then(({ rekap, sumber }) => {
        if (batal) return
        setRekap(rekap)
        setSumber(sumber)
      })
      .finally(() => !batal && setMemuat(false))
    return () => {
      batal = true
    }
  }, [])

  const total = useMemo(() => agregatProvinsi(rekap), [rekap])

  const baris = useMemo(() => {
    const q = cari.trim().toLowerCase()
    const list = q ? rekap.filter((w) => w.nama.toLowerCase().includes(q)) : [...rekap]
    list.sort((a, b) => {
      if (urut === 'rapat') return b.totalRapat - a.totalRapat
      if (urut === 'tertunda') return tindakLanjutTertunda(b) - tindakLanjutTertunda(a)
      return a.nama.localeCompare(b.nama)
    })
    return list
  }, [rekap, cari, urut])

  const tlTertunda = total.tindakLanjutTotal - total.tindakLanjutSelesai

  return (
    <>
      <div className="page-head">
        <h1 style={{ margin: 0 }}>🛰️ Pemantauan Pleno Provinsi Jawa Barat</h1>
        <p>
          Agregasi status rapat pleno {total.totalKabkota} kabupaten/kota secara real-time.{' '}
          {sumber === 'demo' ? (
            <span className="badge badge--amber">Data contoh (backend belum aktif)</span>
          ) : (
            <span className="badge badge--green">Tersambung backend</span>
          )}
        </p>
      </div>

      <div className="stats mt">
        <div className="stat">
          <div className="stat__icon">🏛️</div>
          <div className="stat__num">{total.kabkotaAktif}/{total.totalKabkota}</div>
          <div className="stat__label">Kabkota Aktif (sinkron)</div>
        </div>
        <div className="stat">
          <div className="stat__icon">📋</div>
          <div className="stat__num">{total.totalRapat}</div>
          <div className="stat__label">Total Rapat Pleno</div>
        </div>
        <div className="stat">
          <div className="stat__icon">🔴</div>
          <div className="stat__num">{total.berlangsung}</div>
          <div className="stat__label">Sedang Berlangsung</div>
        </div>
        <div className="stat">
          <div className="stat__icon">📄</div>
          <div className="stat__num">{total.baFinal}</div>
          <div className="stat__label">Berita Acara Final</div>
        </div>
        <div className="stat">
          <div className="stat__icon">⏳</div>
          <div className="stat__num" style={{ color: tlTertunda > 0 ? 'var(--red)' : undefined }}>
            {tlTertunda}
          </div>
          <div className="stat__label">Tindak Lanjut Tertunda</div>
        </div>
      </div>

      <div className="row mt-lg row--between" style={{ flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0 }}>Status per Kabupaten/Kota</h2>
        <div className="row" style={{ gap: 8 }}>
          <input
            className="input"
            placeholder="Cari kabkota…"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            style={{ maxWidth: 200 }}
          />
          <select className="input" value={urut} onChange={(e) => setUrut(e.target.value as Urut)}>
            <option value="nama">Urut: Nama</option>
            <option value="rapat">Urut: Jml Rapat</option>
            <option value="tertunda">Urut: Tindak Lanjut Tertunda</option>
          </select>
        </div>
      </div>

      <div className="card mt">
        {memuat ? (
          <div className="card__body muted">Memuat data pemantauan…</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Kabupaten/Kota</th>
                  <th>Status</th>
                  <th>Rapat</th>
                  <th>Berlangsung</th>
                  <th>Selesai</th>
                  <th>BA Final</th>
                  <th>Kuorum Terakhir</th>
                  <th>TL Tertunda</th>
                  <th>Rapat Terakhir</th>
                </tr>
              </thead>
              <tbody>
                {baris.map((w) => {
                  const tertunda = tindakLanjutTertunda(w)
                  return (
                    <tr key={w.kode}>
                      <td>
                        <strong>{w.nama}</strong>
                        <div className="small muted">{w.kode}</div>
                      </td>
                      <td>
                        {w.aktif ? (
                          <span className="badge badge--green">Aktif</span>
                        ) : (
                          <span className="badge badge--gray">Belum sinkron</span>
                        )}
                      </td>
                      <td>{w.totalRapat}</td>
                      <td>
                        {w.berlangsung > 0 ? (
                          <span className="badge badge--amber">{w.berlangsung}</span>
                        ) : (
                          0
                        )}
                      </td>
                      <td>{w.selesai}</td>
                      <td>{w.baFinal}</td>
                      <td>
                        {w.kuorumTerakhir == null ? (
                          <span className="muted">-</span>
                        ) : w.kuorumTerakhir ? (
                          <span className="badge badge--green">Kuorum</span>
                        ) : (
                          <span className="badge badge--gray">Tidak</span>
                        )}
                      </td>
                      <td style={{ color: tertunda > 0 ? 'var(--red)' : undefined, fontWeight: tertunda > 0 ? 700 : 400 }}>
                        {tertunda}
                      </td>
                      <td>{w.rapatTerakhir ? formatTanggalSingkat(w.rapatTerakhir) : <span className="muted">-</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="small muted mt">
        Catatan: pada mode <strong>produksi</strong>, data ditarik dari backend SIPLENO
        (Supabase self-hosted di server KPU) melalui view <code>v_pemantauan_wilayah</code>.
        Selama backend belum aktif, dashboard menampilkan data contoh agar dapat diperagakan.
      </p>
    </>
  )
}
