import { useMemo, useState } from 'react'
import type { Rapat, Bahan } from '../types'
import { aksi } from '../store'
import { formatTanggal } from '../utils'
import { MODA_LABEL } from '../types'

/** Susun teks undangan resmi untuk WhatsApp/Email. */
function teksUndangan(rapat: Rapat): string {
  const baris = [
    `*UNDANGAN RAPAT PLENO*`,
    rapat.nomor ? `No: ${rapat.nomor}` : '',
    ``,
    `Yth. Bapak/Ibu,`,
    `Dengan hormat mengundang untuk hadir pada Rapat Pleno:`,
    ``,
    `📌 *${rapat.judul}*`,
    `🗓️ ${formatTanggal(rapat.tanggal)}`,
    `⏰ ${rapat.waktuMulai} WIB${rapat.waktuSelesai ? ` s.d. ${rapat.waktuSelesai} WIB` : ''}`,
    `📍 ${rapat.lokasi || '-'} (${MODA_LABEL[rapat.moda]})`,
    rapat.tautanRapat ? `🔗 ${rapat.tautanRapat}` : '',
    ``,
    rapat.agenda.length ? `*Agenda:*` : '',
    ...rapat.agenda.map((a, i) => `${i + 1}. ${a.judul}`),
    ``,
    `Mohon kehadiran tepat waktu. Terima kasih.`,
  ]
  return baris.filter((b) => b !== '').join('\n')
}

/** Tautan Google Calendar (Add to Calendar). */
function calendarUrl(rapat: Rapat): string {
  const d = rapat.tanggal.replace(/-/g, '')
  const t1 = rapat.waktuMulai.replace(':', '') + '00'
  const t2 = (rapat.waktuSelesai || rapat.waktuMulai).replace(':', '') + '00'
  const dates = `${d}T${t1}/${d}T${t2}`
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: rapat.judul,
    dates,
    details: `${rapat.nomor}\n${rapat.tautanRapat ?? ''}`,
    location: rapat.lokasi,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default function TabUndangan({ rapat }: { rapat: Rapat }) {
  const teks = useMemo(() => teksUndangan(rapat), [rapat])
  const [tersalin, setTersalin] = useState(false)
  const [bNama, setBNama] = useState('')
  const [bTautan, setBTautan] = useState('')
  const [bJenis, setBJenis] = useState<Bahan['jenis']>('lampiran')

  function salin() {
    navigator.clipboard?.writeText(teks).then(() => {
      setTersalin(true)
      setTimeout(() => setTersalin(false), 1800)
    })
  }
  function tambahBahan() {
    if (!bNama.trim()) return
    aksi.tambahBahan(rapat.id, { nama: bNama.trim(), tautan: bTautan.trim() || undefined, jenis: bJenis })
    setBNama('')
    setBTautan('')
  }

  return (
    <div className="stack">
      <div className="alert alert--info">
        <span>📨</span>
        <span>Distribusikan undangan melalui WhatsApp, Google Calendar, dan Email. Pengingat otomatis H-1 dan H-0 dapat dipasang lewat Google Calendar.</span>
      </div>

      <div className="card">
        <div className="card__head">
          <h3>Naskah Undangan</h3>
          <div className="row">
            <a className="btn btn--ghost btn--sm" href={calendarUrl(rapat)} target="_blank" rel="noreferrer">🗓️ Google Calendar</a>
            <a className="btn btn--ghost btn--sm" href={`mailto:?subject=${encodeURIComponent('Undangan: ' + rapat.judul)}&body=${encodeURIComponent(teks)}`}>✉️ Email</a>
            <button className="btn btn--primary btn--sm" onClick={salin}>{tersalin ? '✓ Tersalin' : '📋 Salin'}</button>
          </div>
        </div>
        <div className="card__body">
          <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0, fontSize: 14, background: 'var(--surface-2)', padding: 14, borderRadius: 9, border: '1px solid var(--border)' }}>{teks}</pre>
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>Broadcast WhatsApp per Peserta</h3></div>
        <div className="card__body">
          {rapat.peserta.length === 0 ? <p className="muted">Belum ada peserta.</p> : (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Nama</th><th>WhatsApp</th><th></th></tr></thead>
                <tbody>
                  {rapat.peserta.map((p) => (
                    <tr key={p.id}>
                      <td>{p.nama}</td>
                      <td>{p.whatsapp || <span className="muted">tidak ada nomor</span>}</td>
                      <td>
                        {p.whatsapp ? (
                          <a className="btn btn--wa btn--sm" href={`https://wa.me/${p.whatsapp}?text=${encodeURIComponent(teks)}`} target="_blank" rel="noreferrer">Kirim WA</a>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>📎 Bahan Rapat / Lampiran ({rapat.bahan.length})</h3></div>
        <div className="card__body">
          <div className="list">
            {rapat.bahan.map((b) => (
              <div className="line-item" key={b.id}>
                <span>📄</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{b.nama} <span className="badge badge--gray">{b.jenis}</span></div>
                  {b.tautan && <a href={b.tautan} target="_blank" rel="noreferrer" className="small" style={{ color: 'var(--brand)' }}>{b.tautan}</a>}
                </div>
                <button className="btn btn--danger btn--sm" onClick={() => aksi.hapusBahan(rapat.id, b.id)}>Hapus</button>
              </div>
            ))}
            {rapat.bahan.length === 0 && <p className="muted">Belum ada bahan rapat.</p>}
          </div>
          <div className="form-grid mt">
            <div className="field"><label>Nama Dokumen</label><input value={bNama} onChange={(e) => setBNama(e.target.value)} /></div>
            <div className="field"><label>Jenis</label>
              <select value={bJenis} onChange={(e) => setBJenis(e.target.value as Bahan['jenis'])}>
                <option value="agenda">Agenda</option><option value="paparan">Paparan</option>
                <option value="lampiran">Lampiran</option><option value="rujukan">Rujukan</option>
              </select>
            </div>
            <div className="field full"><label>Tautan (Google Drive / repositori)</label><input value={bTautan} onChange={(e) => setBTautan(e.target.value)} placeholder="https://drive.google.com/…" /></div>
          </div>
          <button className="btn btn--ghost" onClick={tambahBahan}>＋ Tambah Bahan</button>
        </div>
      </div>
    </div>
  )
}
