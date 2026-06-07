import { useState } from 'react'
import type { Rapat, Voting } from '../types'
import { aksi, usePleno } from '../store'
import { rekapVoting, persen } from '../utils'
import Modal from '../../components/Modal'

function KartuVoting({ rapat, v, userId }: { rapat: Rapat; v: Voting; userId: string | null }) {
  const rk = rekapVoting(v)
  const ikutPeserta = userId && rapat.peserta.some((p) => p.id === userId)
  const suaraSaya = userId ? v.suara[userId] : undefined
  const totalPeserta = rapat.peserta.length

  return (
    <div className="card">
      <div className="card__head">
        <h3 style={{ flex: 1 }}>{v.pertanyaan}</h3>
        <span className={`badge badge--${v.status === 'dibuka' ? 'green' : v.status === 'ditutup' ? 'gray' : 'amber'}`}>
          {v.status === 'dibuka' ? '🟢 Dibuka' : v.status === 'ditutup' ? '🔒 Ditutup' : 'Draft'}
        </span>
      </div>
      <div className="card__body">
        {v.rahasia && <p className="small muted">🔒 Pemungutan suara rahasia (anonim).</p>}

        {v.status === 'dibuka' && ikutPeserta && (
          <div className="stack" style={{ marginBottom: 14 }}>
            {v.opsi.map((o) => (
              <div key={o.id} className={`vote-opt ${suaraSaya === o.id ? 'vote-opt--chosen' : ''}`}
                onClick={() => aksi.beriSuara(rapat.id, v.id, userId!, o.id)}>
                <span style={{ fontSize: 18 }}>{suaraSaya === o.id ? '🔵' : '⚪'}</span>
                <span>{o.teks}</span>
              </div>
            ))}
            {suaraSaya && <p className="small" style={{ color: 'var(--green)' }}>✓ Suara Anda tersimpan. Anda dapat mengubahnya selama voting dibuka.</p>}
          </div>
        )}
        {v.status === 'dibuka' && !ikutPeserta && (
          <div className="alert alert--warn"><span>⚠️</span><span>Pilih identitas Anda (sebagai peserta rapat ini) di kanan atas untuk memberikan suara.</span></div>
        )}

        {/* Hasil / rekap */}
        <div className="stack">
          {v.opsi.map((o) => {
            const c = rk.hitung[o.id]
            const pct = persen(c, rk.total)
            const menang = v.status === 'ditutup' && rk.menang === o.id
            return (
              <div className="vote-bar" key={o.id} style={menang ? { borderColor: 'var(--green)' } : undefined}>
                <div className="vote-bar__fill" style={{ width: `${pct}%`, background: menang ? '#dcfce7' : undefined }} />
                <div className="vote-bar__content">
                  <span>{menang && '🏆 '}{o.teks}</span>
                  <span>{c} suara · {pct}%</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="small muted mt">{rk.total} dari {totalPeserta} peserta telah memberikan suara.{v.status === 'ditutup' && rk.seri && ' Hasil imbang.'}</p>

        <div className="row mt">
          {v.status === 'draft' && <button className="btn btn--success btn--sm" onClick={() => aksi.bukaVoting(rapat.id, v.id)}>▶️ Buka Voting</button>}
          {v.status === 'dibuka' && <button className="btn btn--primary btn--sm" onClick={() => aksi.tutupVoting(rapat.id, v.id)}>🔒 Tutup & Rekap</button>}
          <button className="btn btn--danger btn--sm" onClick={() => confirm('Hapus voting ini?') && aksi.hapusVoting(rapat.id, v.id)}>Hapus</button>
        </div>
      </div>
    </div>
  )
}

export default function TabVoting({ rapat }: { rapat: Rapat }) {
  const { userId } = usePleno()
  const [modal, setModal] = useState(false)
  const [pertanyaan, setPertanyaan] = useState('')
  const [opsi, setOpsi] = useState('Setuju\nTidak Setuju\nAbstain')
  const [rahasia, setRahasia] = useState(false)

  function buat() {
    if (!pertanyaan.trim()) return
    const list = opsi.split('\n').map((s) => s.trim()).filter(Boolean)
    if (list.length < 2) { alert('Minimal 2 opsi.'); return }
    aksi.buatVoting(rapat.id, pertanyaan.trim(), list, rahasia)
    setModal(false)
    setPertanyaan(''); setOpsi('Setuju\nTidak Setuju\nAbstain'); setRahasia(false)
  }

  return (
    <div className="stack">
      <div className="row row--between">
        <div className="alert alert--info" style={{ flex: 1 }}><span>🗳️</span><span>Pemungutan suara elektronik (gaya Mentimeter/Slido). Hasil direkap otomatis dan menjadi lampiran Berita Acara.</span></div>
      </div>
      <div><button className="btn btn--primary" onClick={() => setModal(true)}>＋ Buat Pemungutan Suara</button></div>

      {rapat.voting.length === 0 ? (
        <div className="empty"><div className="empty__icon">🗳️</div><p>Belum ada pemungutan suara.</p></div>
      ) : (
        rapat.voting.map((v) => <KartuVoting key={v.id} rapat={rapat} v={v} userId={userId} />)
      )}

      {modal && (
        <Modal judul="Buat Pemungutan Suara" onClose={() => setModal(false)}
          footer={<><button className="btn btn--ghost" onClick={() => setModal(false)}>Batal</button><button className="btn btn--primary" onClick={buat}>Buat</button></>}>
          <div className="field"><label>Pertanyaan / Mosi</label><input value={pertanyaan} onChange={(e) => setPertanyaan(e.target.value)} placeholder="mis. Menyetujui penetapan…?" autoFocus /></div>
          <div className="field"><label>Opsi (satu per baris)</label><textarea rows={4} value={opsi} onChange={(e) => setOpsi(e.target.value)} /></div>
          <label className="row" style={{ cursor: 'pointer' }}><input type="checkbox" checked={rahasia} onChange={(e) => setRahasia(e.target.checked)} /> Pemungutan suara rahasia (anonim)</label>
        </Modal>
      )}
    </div>
  )
}
