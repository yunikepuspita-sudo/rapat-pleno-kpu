import { Link } from 'react-router-dom'
import type { Rapat } from '../types'
import { aksi } from '../store'
import { formatTanggal, rekapPresensi, formatWaktu } from '../utils'
import { MODA_LABEL, STATUS_LABEL, type StatusRapat } from '../types'

const NEXT: Record<StatusRapat, { ke: StatusRapat; label: string } | null> = {
  draft: { ke: 'terjadwal', label: 'Jadwalkan' },
  terjadwal: { ke: 'berlangsung', label: '▶️ Mulai Rapat' },
  berlangsung: { ke: 'selesai', label: '⏹️ Selesaikan Rapat' },
  selesai: { ke: 'diarsipkan', label: '🗄️ Arsipkan' },
  diarsipkan: null,
}

export default function TabRingkasan({ rapat }: { rapat: Rapat }) {
  const rk = rekapPresensi(rapat)
  const next = NEXT[rapat.status]
  const votingDitutup = rapat.voting.filter((v) => v.status === 'ditutup').length

  return (
    <div className="stack">
      <div className="card">
        <div className="card__head"><h3>Status & Aksi</h3></div>
        <div className="card__body">
          <div className="row row--between">
            <div>
              Status saat ini: <span className="badge badge--blue">{STATUS_LABEL[rapat.status]}</span>
              <div className="small muted mt">Diperbarui {formatWaktu(rapat.diperbaruiPada)}</div>
            </div>
            <div className="row">
              {next && (
                <button className="btn btn--primary" onClick={() => aksi.setStatus(rapat.id, next.ke)}>
                  {next.label}
                </button>
              )}
              <Link to={`/rapat/${rapat.id}/edit`} className="btn btn--ghost">✏️ Edit</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>Informasi Rapat</h3></div>
        <div className="card__body">
          <table className="table">
            <tbody>
              <tr><td className="muted" style={{ width: 160 }}>Nomor Pleno</td><td>{rapat.nomor || '-'}</td></tr>
              <tr><td className="muted">Tanggal</td><td>{formatTanggal(rapat.tanggal)}</td></tr>
              <tr><td className="muted">Waktu</td><td>{rapat.waktuMulai} WIB{rapat.waktuSelesai ? ` – ${rapat.waktuSelesai} WIB` : ''}</td></tr>
              <tr><td className="muted">Lokasi</td><td>{rapat.lokasi || '-'}</td></tr>
              <tr><td className="muted">Moda</td><td>{MODA_LABEL[rapat.moda]}</td></tr>
              <tr><td className="muted">Tautan Rapat</td><td>{rapat.tautanRapat ? <a href={rapat.tautanRapat} target="_blank" rel="noreferrer" style={{ color: 'var(--brand)' }}>{rapat.tautanRapat}</a> : '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="stats" style={{ marginBottom: 0 }}>
        <div className="stat"><div className="stat__icon">🗒️</div><div className="stat__num">{rapat.agenda.length}</div><div className="stat__label">Butir Agenda</div></div>
        <div className="stat"><div className="stat__icon">👥</div><div className="stat__num">{rk.hadir}/{rk.total}</div><div className="stat__label">Kehadiran {rk.kuorum ? '· Kuorum ✅' : '· Belum kuorum'}</div></div>
        <div className="stat"><div className="stat__icon">🗳️</div><div className="stat__num">{votingDitutup}/{rapat.voting.length}</div><div className="stat__label">Voting Selesai</div></div>
        <div className="stat"><div className="stat__icon">📄</div><div className="stat__num">{rapat.beritaAcara?.status === 'final' ? '✓' : '—'}</div><div className="stat__label">Berita Acara {rapat.beritaAcara?.status ?? 'belum'}</div></div>
      </div>

      <div className="card">
        <div className="card__head"><h3>Agenda</h3></div>
        <div className="card__body">
          {rapat.agenda.length === 0 ? <p className="muted">Belum ada agenda. <Link to={`/rapat/${rapat.id}/edit`} style={{ color: 'var(--brand)' }}>Tambah di Edit →</Link></p> : (
            <div className="list">
              {rapat.agenda.map((a, i) => (
                <div className="line-item" key={a.id}>
                  <span className="line-item__num">{i + 1}</span>
                  <div><div style={{ fontWeight: 600 }}>{a.judul}</div>{a.keterangan && <div className="small muted">{a.keterangan}</div>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
