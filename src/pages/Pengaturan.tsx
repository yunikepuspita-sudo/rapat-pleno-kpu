import { useState } from 'react'
import { usePleno, aksi } from '../pleno/store'
import { aiTersedia } from '../pleno/ai'

const INTEGRASI = [
  { i: '🗓️', n: 'Google Calendar', d: 'Penjadwalan & pengingat otomatis (via tautan undangan).', aktif: true },
  { i: '💬', n: 'WhatsApp', d: 'Distribusi undangan & broadcast (click-to-chat).', aktif: true },
  { i: '📁', n: 'Google Drive', d: 'Repositori bahan & dokumen rapat (tautan).', aktif: true },
  { i: '🎥', n: 'Zoom / Google Meet', d: 'Conference daring & hybrid (tautan rapat).', aktif: true },
  { i: '🎙️', n: 'Otter.ai', d: 'Speech-to-text untuk transkrip rapat.', aktif: true },
  { i: '🗳️', n: 'Mentimeter / Slido', d: 'Voting elektronik (tersedia built-in).', aktif: true },
  { i: '✍️', n: 'Adobe Sign / BSrE', d: 'Tanda tangan elektronik Berita Acara.', aktif: true },
]

export default function Pengaturan() {
  const { profil } = usePleno()
  const [f, setF] = useState(profil)

  return (
    <>
      <div className="page-head"><div><h1>Setelan</h1><p>Profil lembaga & integrasi sistem.</p></div></div>

      <div className="card">
        <div className="card__head"><h3>🏛️ Profil Lembaga</h3></div>
        <div className="card__body">
          <div className="form-grid">
            <div className="field"><label>Nama Lembaga</label><input value={f.namaLembaga} onChange={(e) => setF({ ...f, namaLembaga: e.target.value })} /></div>
            <div className="field"><label>Satuan Kerja</label><input value={f.satuanKerja} onChange={(e) => setF({ ...f, satuanKerja: e.target.value })} /></div>
            <div className="field full"><label>Alamat</label><input value={f.alamat} onChange={(e) => setF({ ...f, alamat: e.target.value })} /></div>
          </div>
          <button className="btn btn--primary" onClick={() => { aksi.setProfil(f); alert('Profil tersimpan.') }}>💾 Simpan Profil</button>
        </div>
      </div>

      <div className="card mt-lg">
        <div className="card__head"><h3>🔌 Integrasi Sistem</h3></div>
        <div className="card__body">
          <div className="row" style={{ marginBottom: 12 }}>
            <span className={`badge badge--${aiTersedia ? 'green' : 'gray'}`}>
              🤖 Notulensi AI (Claude): {aiTersedia ? 'Aktif' : 'Mode lokal'}
            </span>
            {!aiTersedia && <span className="small muted">Aktifkan Supabase Edge Function `pleno-ai` untuk notulensi bertenaga AI. Tanpa itu, generator lokal tetap berfungsi luring.</span>}
          </div>
          <div className="meet-grid">
            {INTEGRASI.map((x) => (
              <div className="line-item" key={x.n}>
                <span style={{ fontSize: 22 }}>{x.i}</span>
                <div style={{ flex: 1 }}><b>{x.n}</b><div className="small muted">{x.d}</div></div>
                <span className="badge badge--green">Aktif</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mt-lg">
        <div className="card__head"><h3>🧪 Data Demo</h3></div>
        <div className="card__body">
          <p className="muted small">Aplikasi menyimpan data di perangkat (localStorage). Anda dapat mengisi ulang contoh data KPU atau mengosongkannya.</p>
          <div className="row">
            <button className="btn btn--ghost" onClick={() => confirm('Muat ulang data contoh? Data saat ini akan diganti.') && aksi.resetDemo()}>🔄 Muat Ulang Demo</button>
            <button className="btn btn--danger" onClick={() => confirm('Kosongkan semua rapat?') && aksi.kosongkan()}>🗑️ Kosongkan Data</button>
          </div>
        </div>
      </div>
    </>
  )
}
