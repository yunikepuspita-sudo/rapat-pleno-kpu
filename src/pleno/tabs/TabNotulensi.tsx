import { useState } from 'react'
import type { Rapat, TindakLanjut } from '../types'
import { aksi } from '../store'
import { buatNotulensi, aiTersedia } from '../ai'
import { uid, formatTanggalSingkat } from '../utils'

export default function TabNotulensi({ rapat }: { rapat: Rapat }) {
  const [pembicara, setPembicara] = useState('')
  const [teks, setTeks] = useState('')
  const [memproses, setMemproses] = useState(false)
  const n = rapat.notulensi

  // form tindak lanjut
  const [tlUraian, setTlUraian] = useState('')
  const [tlPj, setTlPj] = useState('')
  const [tlTenggat, setTlTenggat] = useState('')

  function tambahSegmen() {
    if (!teks.trim()) return
    aksi.tambahSegmen(rapat.id, pembicara.trim() || 'Peserta', teks.trim())
    setTeks('')
  }

  async function generate() {
    setMemproses(true)
    try {
      const hasil = await buatNotulensi(rapat)
      aksi.setNotulensi(rapat.id, hasil)
    } finally {
      setMemproses(false)
    }
  }

  function tambahTindakLanjut() {
    if (!tlUraian.trim() || !n) return
    const baru: TindakLanjut = {
      id: uid('tl-'),
      uraian: tlUraian.trim(),
      penanggungJawab: tlPj.trim() || undefined,
      tenggat: tlTenggat || undefined,
      status: 'belum',
    }
    aksi.setTindakLanjut(rapat.id, [...n.tindakLanjut, baru])
    setTlUraian(''); setTlPj(''); setTlTenggat('')
  }
  function ubahStatusTl(id: string, status: TindakLanjut['status']) {
    if (!n) return
    aksi.setTindakLanjut(rapat.id, n.tindakLanjut.map((t) => (t.id === id ? { ...t, status } : t)))
  }
  function hapusTl(id: string) {
    if (!n) return
    aksi.setTindakLanjut(rapat.id, n.tindakLanjut.filter((t) => t.id !== id))
  }

  return (
    <div className="stack">
      <div className="card">
        <div className="card__head">
          <h3>📝 Transkrip Rapat ({rapat.transkrip.length} segmen)</h3>
        </div>
        <div className="card__body">
          {rapat.transkrip.length === 0 ? (
            <p className="muted">Belum ada transkrip. Tambahkan catatan/transkrip Otter.ai di bawah.</p>
          ) : (
            <div className="list">
              {rapat.transkrip.map((s) => (
                <div className="line-item" key={s.id}>
                  <div style={{ flex: 1 }}>
                    <b>{s.pembicara}</b> {s.waktu && <span className="small muted">· {s.waktu}</span>}
                    <div>{s.teks}</div>
                  </div>
                  <button className="btn btn--danger btn--sm" onClick={() => aksi.setTranskrip(rapat.id, rapat.transkrip.filter((x) => x.id !== s.id))}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="form-grid mt">
            <div className="field"><label>Pembicara</label><input value={pembicara} onChange={(e) => setPembicara(e.target.value)} placeholder="mis. Ketua" /></div>
            <div className="field full"><label>Catatan / Transkrip</label><textarea value={teks} onChange={(e) => setTeks(e.target.value)} placeholder="Tempel transkrip Otter.ai atau ketik catatan…" /></div>
          </div>
          <button className="btn btn--ghost" onClick={tambahSegmen}>＋ Tambah Segmen</button>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>🤖 Notulensi Otomatis</h3>
          <button className="btn btn--primary btn--sm" onClick={generate} disabled={memproses}>
            {memproses ? '⏳ Menyusun…' : n ? '🔄 Susun Ulang' : '✨ Susun Notulensi'}
          </button>
        </div>
        <div className="card__body">
          {!n ? (
            <p className="muted">Tekan "Susun Notulensi" untuk meringkas pembahasan, mengekstrak keputusan dari hasil voting & transkrip, secara otomatis.</p>
          ) : (
            <>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className={`badge badge--${n.sumber === 'ai' ? 'purple' : 'gray'}`}>
                  {n.sumber === 'ai' ? '🤖 Disusun AI (Claude)' : '⚙️ Generator lokal'}
                </span>
                {!aiTersedia && <span className="small muted">AI Claude opsional — aktifkan via Supabase Edge Function untuk hasil lebih kaya.</span>}
              </div>
              <h4>Ringkasan</h4>
              <p>{n.ringkasan}</p>
              {n.poinPembahasan.length > 0 && (<><h4>Poin Pembahasan</h4><ul>{n.poinPembahasan.map((p, i) => <li key={i}>{p}</li>)}</ul></>)}
              {n.keputusan.length > 0 && (<><h4>Keputusan</h4><ol>{n.keputusan.map((k, i) => <li key={i}>{k}</li>)}</ol></>)}
            </>
          )}
        </div>
      </div>

      {n && (
        <div className="card">
          <div className="card__head"><h3>✅ Tindak Lanjut Keputusan</h3></div>
          <div className="card__body">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Uraian</th><th>PJ</th><th>Tenggat</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {n.tindakLanjut.map((t) => (
                    <tr key={t.id}>
                      <td>{t.uraian}</td>
                      <td>{t.penanggungJawab || '-'}</td>
                      <td className="small">{t.tenggat ? formatTanggalSingkat(t.tenggat) : '-'}</td>
                      <td>
                        <select value={t.status} onChange={(e) => ubahStatusTl(t.id, e.target.value as TindakLanjut['status'])}
                          style={{ border: '1.5px solid var(--border)', borderRadius: 7, padding: '4px 6px' }}>
                          <option value="belum">Belum</option><option value="proses">Proses</option><option value="selesai">Selesai</option>
                        </select>
                      </td>
                      <td><button className="btn btn--danger btn--sm" onClick={() => hapusTl(t.id)}>✕</button></td>
                    </tr>
                  ))}
                  {n.tindakLanjut.length === 0 && <tr><td colSpan={5} className="muted center">Belum ada tindak lanjut.</td></tr>}
                </tbody>
              </table>
            </div>
            <div className="form-grid mt">
              <div className="field full"><label>Uraian Tindak Lanjut</label><input value={tlUraian} onChange={(e) => setTlUraian(e.target.value)} /></div>
              <div className="field"><label>Penanggung Jawab</label><input value={tlPj} onChange={(e) => setTlPj(e.target.value)} /></div>
              <div className="field"><label>Tenggat</label><input type="date" value={tlTenggat} onChange={(e) => setTlTenggat(e.target.value)} /></div>
            </div>
            <button className="btn btn--ghost" onClick={tambahTindakLanjut}>＋ Tambah Tindak Lanjut</button>
          </div>
        </div>
      )}
    </div>
  )
}
