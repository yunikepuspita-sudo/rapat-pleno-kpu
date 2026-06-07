import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getRapat, usePleno, aksi } from '../pleno/store'
import StatusBadge from '../components/StatusBadge'
import { formatTanggalSingkat } from '../pleno/utils'
import TabRingkasan from '../pleno/tabs/TabRingkasan'
import TabUndangan from '../pleno/tabs/TabUndangan'
import TabPresensi from '../pleno/tabs/TabPresensi'
import TabPelaksanaan from '../pleno/tabs/TabPelaksanaan'
import TabNotulensi from '../pleno/tabs/TabNotulensi'
import TabVoting from '../pleno/tabs/TabVoting'
import TabBeritaAcara from '../pleno/tabs/TabBeritaAcara'

const TABS = [
  { id: 'ringkasan', label: '📊 Ringkasan' },
  { id: 'undangan', label: '📨 Undangan' },
  { id: 'presensi', label: '📱 Presensi' },
  { id: 'pelaksanaan', label: '🎥 Pelaksanaan' },
  { id: 'notulensi', label: '📝 Notulensi' },
  { id: 'voting', label: '🗳️ Voting' },
  { id: 'berita-acara', label: '📄 Berita Acara' },
] as const

export default function RapatDetail() {
  const { id } = useParams()
  usePleno() // langganan store
  const nav = useNavigate()
  const rapat = getRapat(id)
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('ringkasan')

  if (!rapat) {
    return (
      <div className="empty">
        <div className="empty__icon">🔍</div>
        <h3>Rapat tidak ditemukan</h3>
        <Link to="/rapat" className="btn btn--primary mt">Kembali ke daftar</Link>
      </div>
    )
  }

  function hapus() {
    if (confirm('Hapus rapat ini beserta seluruh datanya?')) {
      aksi.hapusRapat(rapat!.id)
      nav('/rapat')
    }
  }

  return (
    <>
      <div className="row small muted" style={{ marginBottom: 8 }}>
        <Link to="/rapat" style={{ color: 'var(--brand)' }}>← Daftar Rapat</Link>
      </div>
      <div className="page-head">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <span className="meet-card__nomor">{rapat.nomor || 'Tanpa nomor'}</span>
            <StatusBadge status={rapat.status} />
          </div>
          <h1 style={{ marginTop: 4 }}>{rapat.judul}</h1>
          <p>📅 {formatTanggalSingkat(rapat.tanggal)} · {rapat.waktuMulai} WIB · 📍 {rapat.lokasi || '-'}</p>
        </div>
        <div className="row">
          <Link to={`/rapat/${rapat.id}/edit`} className="btn btn--ghost btn--sm">✏️ Edit</Link>
          <button className="btn btn--danger btn--sm" onClick={hapus}>🗑️ Hapus</button>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'active' : ''} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </div>

      {tab === 'ringkasan' && <TabRingkasan rapat={rapat} />}
      {tab === 'undangan' && <TabUndangan rapat={rapat} />}
      {tab === 'presensi' && <TabPresensi rapat={rapat} />}
      {tab === 'pelaksanaan' && <TabPelaksanaan rapat={rapat} />}
      {tab === 'notulensi' && <TabNotulensi rapat={rapat} />}
      {tab === 'voting' && <TabVoting rapat={rapat} />}
      {tab === 'berita-acara' && <TabBeritaAcara rapat={rapat} />}
    </>
  )
}
