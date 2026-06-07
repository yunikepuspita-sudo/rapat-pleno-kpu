import { useState } from 'react'
import type { Rapat, StatusHadir } from '../types'
import { aksi } from '../store'
import { rekapPresensi, statusPresensi, formatWaktu, persen } from '../utils'
import { PERAN_LABEL } from '../types'
import QrCode from '../../components/QrCode'

function checkinUrl(rapatId: string): string {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#/hadir/${rapatId}`
}

const OPSI: { v: StatusHadir; label: string; cls: string }[] = [
  { v: 'hadir', label: 'Hadir', cls: 'green' },
  { v: 'izin', label: 'Izin', cls: 'amber' },
  { v: 'tidak-hadir', label: 'Tidak Hadir', cls: 'gray' },
]

export default function TabPresensi({ rapat }: { rapat: Rapat }) {
  const rk = rekapPresensi(rapat)
  const [tampilQr, setTampilQr] = useState(true)
  const url = checkinUrl(rapat.id)

  return (
    <div className="stack">
      <div className="stats" style={{ marginBottom: 0 }}>
        <div className="stat"><div className="stat__icon">👥</div><div className="stat__num">{rk.total}</div><div className="stat__label">Diundang</div></div>
        <div className="stat"><div className="stat__icon">✅</div><div className="stat__num" style={{ color: 'var(--green)' }}>{rk.hadir}</div><div className="stat__label">Hadir</div></div>
        <div className="stat"><div className="stat__icon">📝</div><div className="stat__num" style={{ color: 'var(--amber)' }}>{rk.izin}</div><div className="stat__label">Izin</div></div>
        <div className="stat"><div className="stat__icon">{rk.kuorum ? '🟢' : '🔴'}</div><div className="stat__num">{rk.kuorum ? 'Tercapai' : 'Belum'}</div><div className="stat__label">Kuorum (min. {rk.ambangKuorum})</div></div>
      </div>

      <div className={`alert ${rk.kuorum ? 'alert--ok' : 'alert--warn'}`}>
        <span>{rk.kuorum ? '🟢' : '⚠️'}</span>
        <span>
          {rk.kuorum
            ? `Kuorum terpenuhi: ${rk.hadir} dari ${rk.total} peserta hadir (ambang ${rk.ambangKuorum}). Rapat sah dilanjutkan.`
            : `Kuorum belum terpenuhi: ${rk.hadir} dari ${rk.total} hadir. Dibutuhkan minimal ${rk.ambangKuorum} peserta.`}
        </span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>📱 QR Presensi</h3>
          <button className="btn btn--ghost btn--sm" onClick={() => setTampilQr((v) => !v)}>{tampilQr ? 'Sembunyikan' : 'Tampilkan'}</button>
        </div>
        {tampilQr && (
          <div className="card__body center">
            <div className="qr-box"><QrCode value={url} /></div>
            <p className="muted small mt">Peserta memindai QR ini dengan kamera ponsel, lalu memilih nama untuk check-in.</p>
            <div className="row" style={{ justifyContent: 'center' }}>
              <input readOnly value={url} style={{ width: 320, maxWidth: '100%', border: '1.5px solid var(--border)', borderRadius: 9, padding: '8px 10px', fontSize: 12 }} />
              <button className="btn btn--ghost btn--sm" onClick={() => navigator.clipboard?.writeText(url)}>📋 Salin tautan</button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <div className="card__head"><h3>Daftar Hadir Digital</h3></div>
        <div className="card__body">
          <div className="progress" style={{ marginBottom: 14 }}>
            <div className="progress__bar" style={{ width: `${persen(rk.hadir, rk.total)}%` }} />
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nama</th><th>Peran</th><th>Waktu Check-in</th><th>Status / Tandai</th></tr></thead>
              <tbody>
                {rapat.peserta.map((p) => {
                  const pr = statusPresensi(rapat, p.id)
                  return (
                    <tr key={p.id}>
                      <td>{p.nama}<div className="small muted">{p.jabatan}</div></td>
                      <td><span className="badge badge--blue">{PERAN_LABEL[p.peran]}</span></td>
                      <td className="small">{pr.status === 'hadir' && pr.waktu ? `${formatWaktu(pr.waktu)} ${pr.metode === 'qr' ? '(QR)' : '(manual)'}` : '—'}</td>
                      <td>
                        <div className="row" style={{ gap: 6 }}>
                          {OPSI.map((o) => (
                            <button key={o.v}
                              className={`badge badge--${pr.status === o.v ? o.cls : 'gray'}`}
                              style={{ cursor: 'pointer', border: pr.status === o.v ? '1px solid currentColor' : '1px solid transparent', opacity: pr.status === o.v ? 1 : .6 }}
                              onClick={() => aksi.setPresensi(rapat.id, p.id, o.v, 'manual')}>
                              {o.label}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {rapat.peserta.length === 0 && <tr><td colSpan={4} className="muted center">Belum ada peserta.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
