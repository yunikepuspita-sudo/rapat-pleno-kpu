import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePleno } from '../pleno/store'
import { formatTanggalSingkat } from '../pleno/utils'
import StatusBadge from '../components/StatusBadge'
import { MODA_LABEL, STATUS_LABEL, type StatusRapat } from '../pleno/types'

const FILTER: (StatusRapat | 'semua')[] = ['semua', 'draft', 'terjadwal', 'berlangsung', 'selesai', 'diarsipkan']

export default function RapatList() {
  const { rapat } = usePleno()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<StatusRapat | 'semua'>('semua')

  const hasil = rapat
    .filter((r) => filter === 'semua' || r.status === filter)
    .filter((r) => {
      const t = q.toLowerCase().trim()
      return !t || r.judul.toLowerCase().includes(t) || r.nomor.toLowerCase().includes(t)
    })

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Rapat Pleno</h1>
          <p>Kelola seluruh rapat pleno — dari persiapan hingga arsip.</p>
        </div>
        <Link to="/rapat/baru" className="btn btn--primary">＋ Rapat Baru</Link>
      </div>

      <div className="row">
        <input
          className="field"
          style={{ flex: 1, minWidth: 200, marginBottom: 0, border: '1.5px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}
          placeholder="🔎 Cari judul atau nomor pleno…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <div className="row mt">
        {FILTER.map((f) => (
          <button
            key={f}
            className={`chip`}
            onClick={() => setFilter(f)}
            style={{ cursor: 'pointer', background: filter === f ? 'var(--brand)' : undefined, color: filter === f ? '#fff' : undefined, borderColor: filter === f ? 'var(--brand)' : undefined }}
          >
            {f === 'semua' ? 'Semua' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>

      {hasil.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">📋</div>
          <h3>Belum ada rapat</h3>
          <p>Mulai dengan menjadwalkan rapat pleno baru.</p>
          <Link to="/rapat/baru" className="btn btn--primary mt">＋ Rapat Baru</Link>
        </div>
      ) : (
        <div className="meet-grid mt-lg">
          {hasil.map((r) => (
            <Link to={`/rapat/${r.id}`} className="meet-card" key={r.id}>
              <div className="row row--between">
                <span className="meet-card__nomor">{r.nomor || 'Tanpa nomor'}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="meet-card__title">{r.judul}</div>
              <div className="meet-card__meta">
                <span>📅 {formatTanggalSingkat(r.tanggal)} · {r.waktuMulai} WIB</span>
                <span>📍 {r.lokasi || '-'}</span>
                <span>🔗 {MODA_LABEL[r.moda]} · 👥 {r.peserta.length} · 🗳️ {r.voting.length} voting</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
