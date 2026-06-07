import { useState } from 'react'
import { Link } from 'react-router-dom'
import { usePleno } from '../pleno/store'
import { formatTanggalSingkat, rekapPresensi, rekapVoting } from '../pleno/utils'

/** Arsip & knowledge management: pencarian Berita Acara final/keputusan pleno. */
export default function Arsip() {
  const { rapat } = usePleno()
  const [q, setQ] = useState('')

  const arsip = rapat
    .filter((r) => r.beritaAcara && r.beritaAcara.status !== 'belum')
    .filter((r) => {
      const t = q.toLowerCase().trim()
      if (!t) return true
      const haystack = [r.judul, r.nomor, ...(r.notulensi?.keputusan ?? [])].join(' ').toLowerCase()
      return haystack.includes(t)
    })
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Arsip & Repositori Keputusan</h1>
          <p>Pencarian Berita Acara, keputusan pleno, dan metadata rapat.</p>
        </div>
      </div>

      <input
        placeholder="🔎 Cari keputusan, nomor, atau judul pleno…"
        value={q} onChange={(e) => setQ(e.target.value)}
        style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 9, padding: '11px 14px', fontSize: 15 }}
      />

      {arsip.length === 0 ? (
        <div className="empty"><div className="empty__icon">🗄️</div><h3>Belum ada arsip</h3><p>Berita Acara yang sudah disusun akan muncul di sini.</p></div>
      ) : (
        <div className="stack mt-lg">
          {arsip.map((r) => {
            const rk = rekapPresensi(r)
            return (
              <div className="card" key={r.id}>
                <div className="card__body">
                  <div className="row row--between">
                    <div>
                      <div className="meet-card__nomor">{r.nomor}</div>
                      <h3 style={{ margin: '4px 0' }}>{r.judul}</h3>
                    </div>
                    <span className={`badge badge--${r.beritaAcara!.status === 'final' ? 'green' : 'amber'}`}>BA {r.beritaAcara!.status}</span>
                  </div>
                  <div className="row small muted" style={{ gap: 16 }}>
                    <span>📅 {formatTanggalSingkat(r.tanggal)}</span>
                    <span>👥 {rk.hadir}/{rk.total} hadir</span>
                    <span>🗳️ {r.voting.filter((v) => v.status === 'ditutup').length} voting</span>
                    <span>✍️ {r.beritaAcara!.tandaTangan.filter((t) => t.ditandatangani).length}/{r.beritaAcara!.tandaTangan.length} ttd</span>
                  </div>

                  {(r.notulensi?.keputusan?.length ?? 0) > 0 && (
                    <div className="mt">
                      <b className="small">Keputusan:</b>
                      <ul style={{ margin: '6px 0' }}>
                        {r.notulensi!.keputusan.slice(0, 3).map((k, i) => <li key={i} className="small">{k}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* hasil voting ringkas */}
                  {r.voting.filter((v) => v.status === 'ditutup').map((v) => {
                    const rkv = rekapVoting(v)
                    const menang = v.opsi.find((o) => o.id === rkv.menang)
                    return <div key={v.id} className="chip mt" style={{ marginRight: 6 }}>🗳️ {v.pertanyaan.slice(0, 40)}… → {menang?.teks ?? 'imbang'}</div>
                  })}

                  <div className="mt"><Link to={`/rapat/${r.id}`} className="btn btn--ghost btn--sm">Buka Berita Acara →</Link></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
