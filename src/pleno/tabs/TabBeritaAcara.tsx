import type { Rapat } from '../types'
import { aksi, usePleno } from '../store'
import { susunBeritaAcara } from '../ai'
import { PERAN_LABEL, type BeritaAcara, type StatusBA } from '../types'
import { formatWaktu } from '../utils'
import Markdown from '../../components/Markdown'

const ALUR_STATUS: StatusBA[] = ['draft', 'review', 'final']

export default function TabBeritaAcara({ rapat }: { rapat: Rapat }) {
  const { profil, userId } = usePleno()
  const ba = rapat.beritaAcara

  function buatDraft() {
    const isi = susunBeritaAcara(rapat, profil)
    const penandatangan = rapat.peserta.filter((p) => p.peran !== 'peserta')
    const baBaru: BeritaAcara = {
      nomor: ba?.nomor || rapat.nomor || '',
      isi,
      status: 'draft',
      tandaTangan: penandatangan.map((p) => ({
        pesertaId: p.id,
        peran: p.peran,
        ditandatangani: ba?.tandaTangan.find((t) => t.pesertaId === p.id)?.ditandatangani ?? false,
      })),
      dibuatPada: ba?.dibuatPada || new Date().toISOString(),
    }
    aksi.setBeritaAcara(rapat.id, baBaru)
  }

  function setStatus(status: StatusBA) {
    if (!ba) return
    aksi.setBeritaAcara(rapat.id, {
      ...ba,
      status,
      difinalkanPada: status === 'final' ? new Date().toISOString() : ba.difinalkanPada,
    })
  }

  function cetak() {
    window.print()
  }

  if (!ba || ba.status === 'belum') {
    return (
      <div className="stack">
        <div className="alert alert--info">
          <span>📄</span>
          <span>Berita Acara disusun otomatis dengan menggabungkan agenda, daftar hadir & kuorum, ringkasan notulensi, hasil voting, keputusan, dan tindak lanjut.</span>
        </div>
        <div className="empty">
          <div className="empty__icon">📄</div>
          <h3>Belum ada Berita Acara</h3>
          <p>Pastikan notulensi & voting telah disusun, lalu hasilkan draft BA.</p>
          <button className="btn btn--primary mt" onClick={buatDraft}>✨ Susun Berita Acara Otomatis</button>
        </div>
      </div>
    )
  }

  const sudahTtd = ba.tandaTangan.filter((t) => t.ditandatangani).length
  // Naskah bisa kosong (mis. data seed) — susun on-the-fly untuk ditampilkan.
  const naskah = ba.isi?.trim() ? ba.isi : susunBeritaAcara(rapat, profil)

  return (
    <div className="stack">
      <div className="card">
        <div className="card__head">
          <h3>Berita Acara Pleno</h3>
          <div className="row">
            <span className={`badge badge--${ba.status === 'final' ? 'green' : ba.status === 'review' ? 'blue' : 'amber'}`}>{ba.status.toUpperCase()}</span>
            <button className="btn btn--ghost btn--sm" onClick={buatDraft}>🔄 Susun Ulang</button>
            <button className="btn btn--ghost btn--sm" onClick={cetak}>🖨️ Cetak / PDF</button>
          </div>
        </div>
        <div className="card__body">
          {/* Alur status BA */}
          <div className="row" style={{ marginBottom: 12 }}>
            {ALUR_STATUS.map((s, i) => (
              <span key={s} className="row" style={{ gap: 6 }}>
                <button className={`badge badge--${ba.status === s ? 'blue' : 'gray'}`} style={{ cursor: 'pointer' }} onClick={() => setStatus(s)}>
                  {i + 1}. {s}
                </button>
                {i < ALUR_STATUS.length - 1 && <span className="muted">→</span>}
              </span>
            ))}
          </div>
          <Markdown text={naskah} />
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>✍️ Tanda Tangan Elektronik ({sudahTtd}/{ba.tandaTangan.length})</h3></div>
        <div className="card__body">
          <p className="small muted">Tanda tangan digital (Adobe Sign / BSrE). Pilih identitas Anda di kanan atas, lalu tandatangani sesuai peran.</p>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Penandatangan</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {ba.tandaTangan.map((t) => {
                  const p = rapat.peserta.find((x) => x.id === t.pesertaId)
                  const bolehTtd = userId === t.pesertaId
                  return (
                    <tr key={t.pesertaId}>
                      <td>{p?.nama ?? t.pesertaId}</td>
                      <td><span className="badge badge--blue">{PERAN_LABEL[t.peran]}</span></td>
                      <td>{t.ditandatangani ? <span className="badge badge--green">✅ Ditandatangani {t.waktu ? `· ${formatWaktu(t.waktu)}` : ''}</span> : <span className="badge badge--gray">⬜ Menunggu</span>}</td>
                      <td>
                        {t.ditandatangani ? '—' : bolehTtd ? (
                          <button className="btn btn--success btn--sm" onClick={() => aksi.tandaTangani(rapat.id, t.pesertaId)}>✍️ Tandatangani</button>
                        ) : <span className="small muted">hanya {p?.nama?.split(' ')[0]}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {sudahTtd === ba.tandaTangan.length && ba.status !== 'final' && (
            <div className="alert alert--ok mt"><span>✅</span><span>Seluruh pihak telah menandatangani. <button className="btn btn--success btn--sm" onClick={() => setStatus('final')}>Finalkan Berita Acara</button></span></div>
          )}
        </div>
      </div>
    </div>
  )
}
