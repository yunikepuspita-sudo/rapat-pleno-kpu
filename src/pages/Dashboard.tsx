import { Link } from 'react-router-dom'
import { usePleno } from '../pleno/store'
import { formatTanggalSingkat, hariIni } from '../pleno/utils'
import StatusBadge from '../components/StatusBadge'
import { MODA_LABEL, type TindakLanjut } from '../pleno/types'

const ALUR = [
  { i: '🗓️', t: 'Persiapan' },
  { i: '📨', t: 'Undangan' },
  { i: '📱', t: 'Presensi QR' },
  { i: '🎥', t: 'Pelaksanaan' },
  { i: '📝', t: 'Notulensi AI' },
  { i: '🗳️', t: 'Voting' },
  { i: '📄', t: 'Berita Acara' },
  { i: '✍️', t: 'Tanda Tangan' },
  { i: '🗄️', t: 'Arsip' },
]

export default function Dashboard() {
  const { rapat } = usePleno()

  const akanDatang = rapat
    .filter((r) => r.status === 'terjadwal' || r.status === 'berlangsung')
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
  const selesai = rapat.filter((r) => r.status === 'selesai' || r.status === 'diarsipkan')
  const baFinal = rapat.filter((r) => r.beritaAcara?.status === 'final')

  // Agregasi tindak lanjut lintas rapat (monitoring keputusan pleno).
  const tindakLanjut: (TindakLanjut & { rapatId: string; rapatJudul: string })[] = []
  for (const r of rapat) {
    for (const t of r.notulensi?.tindakLanjut ?? []) {
      tindakLanjut.push({ ...t, rapatId: r.id, rapatJudul: r.judul })
    }
  }
  const belumSelesai = tindakLanjut.filter((t) => t.status !== 'selesai')

  return (
    <>
      <section className="hero">
        <h1>Portal Rapat Pleno KPU</h1>
        <p>
          Satu alur kerja digital end-to-end: perencanaan, undangan, presensi QR, pelaksanaan,
          voting elektronik, notulensi AI, Berita Acara otomatis, tanda tangan digital, hingga arsip.
        </p>
        <div className="row mt">
          <Link to="/rapat/baru" className="btn" style={{ background: '#fff', color: 'var(--brand)' }}>
            ＋ Jadwalkan Rapat Pleno
          </Link>
          <Link to="/rapat" className="btn btn--ghost" style={{ color: '#fff', borderColor: 'rgba(255,255,255,.5)' }}>
            Lihat Semua Rapat
          </Link>
        </div>
      </section>

      <div className="stats">
        <div className="stat">
          <div className="stat__icon">📋</div>
          <div className="stat__num">{rapat.length}</div>
          <div className="stat__label">Total Rapat Pleno</div>
        </div>
        <div className="stat">
          <div className="stat__icon">🗓️</div>
          <div className="stat__num">{akanDatang.length}</div>
          <div className="stat__label">Terjadwal / Berlangsung</div>
        </div>
        <div className="stat">
          <div className="stat__icon">✅</div>
          <div className="stat__num">{selesai.length}</div>
          <div className="stat__label">Rapat Selesai</div>
        </div>
        <div className="stat">
          <div className="stat__icon">📄</div>
          <div className="stat__num">{baFinal.length}</div>
          <div className="stat__label">Berita Acara Final</div>
        </div>
      </div>

      <div className="card mt">
        <div className="card__head"><h3>Alur Kerja Pleno Terintegrasi</h3></div>
        <div className="card__body">
          <div className="flow">
            {ALUR.map((s, i) => (
              <div className="flow__step" key={s.t}>
                <b>{s.i}</b>
                {i + 1}. {s.t}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="row mt-lg row--between">
        <h2 style={{ margin: 0 }}>Rapat Mendatang</h2>
        <Link to="/rapat" className="small" style={{ color: 'var(--brand)', fontWeight: 700 }}>Semua →</Link>
      </div>
      {akanDatang.length === 0 ? (
        <div className="card mt"><div className="card__body muted">Tidak ada rapat terjadwal. <Link to="/rapat/baru" style={{ color: 'var(--brand)', fontWeight: 600 }}>Jadwalkan sekarang →</Link></div></div>
      ) : (
        <div className="meet-grid mt">
          {akanDatang.map((r) => (
            <Link to={`/rapat/${r.id}`} className="meet-card" key={r.id}>
              <div className="row row--between">
                <span className="meet-card__nomor">{r.nomor || 'Tanpa nomor'}</span>
                <StatusBadge status={r.status} />
              </div>
              <div className="meet-card__title">{r.judul}</div>
              <div className="meet-card__meta">
                <span>📅 {formatTanggalSingkat(r.tanggal)} · {r.waktuMulai} WIB</span>
                <span>📍 {r.lokasi || '-'}</span>
                <span>🔗 {MODA_LABEL[r.moda]} · 👥 {r.peserta.length} peserta</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <h2 className="mt-lg">Monitoring Tindak Lanjut Keputusan</h2>
      <div className="card mt">
        {belumSelesai.length === 0 ? (
          <div className="card__body muted">Semua tindak lanjut keputusan pleno telah selesai. 🎉</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Uraian</th><th>Rapat</th><th>Penanggung Jawab</th><th>Tenggat</th><th>Status</th></tr>
              </thead>
              <tbody>
                {belumSelesai.map((t) => (
                  <tr key={t.id}>
                    <td>{t.uraian}</td>
                    <td><Link to={`/rapat/${t.rapatId}`} style={{ color: 'var(--brand)' }}>{t.rapatJudul}</Link></td>
                    <td>{t.penanggungJawab || '-'}</td>
                    <td className={t.tenggat && t.tenggat < hariIni() ? '' : ''} style={{ color: t.tenggat && t.tenggat < hariIni() ? 'var(--red)' : undefined }}>
                      {t.tenggat ? formatTanggalSingkat(t.tenggat) : '-'}
                    </td>
                    <td>
                      <span className={`badge badge--${t.status === 'proses' ? 'amber' : 'gray'}`}>
                        {t.status === 'proses' ? 'Proses' : 'Belum'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
