import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRapat, usePleno, aksi } from '../pleno/store'
import { formatTanggal, statusPresensi } from '../pleno/utils'
import { MODA_LABEL, PERAN_LABEL } from '../pleno/types'

/** Halaman check-in presensi (tujuan pemindaian QR). Layar penuh. */
export default function Hadir() {
  const { id } = useParams()
  usePleno()
  const rapat = getRapat(id)
  const [terpilih, setTerpilih] = useState('')

  if (!rapat) {
    return (
      <div className="content center">
        <div className="empty"><div className="empty__icon">❓</div><h2>Rapat tidak ditemukan</h2>
          <p className="muted">QR mungkin sudah tidak berlaku.</p>
          <Link to="/" className="btn btn--primary mt">Beranda</Link>
        </div>
      </div>
    )
  }

  function checkin(pesertaId: string) {
    aksi.setPresensi(rapat!.id, pesertaId, 'hadir', 'qr')
    aksi.setUser(pesertaId) // ingat identitas di perangkat ini
    setTerpilih(pesertaId)
  }

  const pesertaTerpilih = rapat.peserta.find((p) => p.id === terpilih)

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#1e40af,#3b82f6)', padding: '24px 16px' }}>
      <div style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', color: '#fff', marginBottom: 16 }}>
          <div style={{ fontSize: 40 }}>🗳️</div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Presensi Rapat Pleno</div>
        </div>

        <div className="card">
          <div className="card__body">
            <div className="meet-card__nomor">{rapat.nomor}</div>
            <h2 style={{ fontSize: 18, margin: '4px 0 10px' }}>{rapat.judul}</h2>
            <div className="meet-card__meta" style={{ marginBottom: 14 }}>
              <span>📅 {formatTanggal(rapat.tanggal)} · {rapat.waktuMulai} WIB</span>
              <span>📍 {rapat.lokasi || '-'} ({MODA_LABEL[rapat.moda]})</span>
            </div>

            {pesertaTerpilih ? (
              <div className="alert alert--ok" style={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <span style={{ fontSize: 36 }}>✅</span>
                <h3 style={{ margin: '6px 0' }}>Presensi Berhasil</h3>
                <p style={{ margin: 0 }}>Terima kasih, <b>{pesertaTerpilih.nama}</b>. Kehadiran Anda tercatat.</p>
                <Link to={`/rapat/${rapat.id}`} className="btn btn--primary mt">Lihat Rapat</Link>
              </div>
            ) : (
              <>
                <p className="small muted">Pilih nama Anda untuk mencatat kehadiran:</p>
                <div className="stack">
                  {rapat.peserta.map((p) => {
                    const sudah = statusPresensi(rapat, p.id).status === 'hadir'
                    return (
                      <button key={p.id} className="vote-opt" disabled={sudah}
                        style={{ justifyContent: 'space-between', opacity: sudah ? .6 : 1 }}
                        onClick={() => checkin(p.id)}>
                        <span><b>{p.nama}</b><br /><span className="small muted">{p.jabatan} · {PERAN_LABEL[p.peran]}</span></span>
                        <span>{sudah ? '✅ Hadir' : '→'}</span>
                      </button>
                    )
                  })}
                  {rapat.peserta.length === 0 && <p className="muted center">Belum ada peserta terdaftar.</p>}
                </div>
              </>
            )}
          </div>
        </div>
        <p className="center small" style={{ color: 'rgba(255,255,255,.85)', marginTop: 14 }}>Portal Rapat Pleno KPU</p>
      </div>
    </div>
  )
}
