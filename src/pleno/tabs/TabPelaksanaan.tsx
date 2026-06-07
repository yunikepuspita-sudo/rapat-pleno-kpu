import type { Rapat } from '../types'
import { aksi } from '../store'
import { MODA_LABEL } from '../types'

export default function TabPelaksanaan({ rapat }: { rapat: Rapat }) {
  const paparan = rapat.bahan.filter((b) => b.jenis === 'paparan')
  const berlangsung = rapat.status === 'berlangsung'

  return (
    <div className="stack">
      <div className={`alert ${berlangsung ? 'alert--ok' : 'alert--info'}`}>
        <span>{berlangsung ? '🔴' : '🎥'}</span>
        <span>{berlangsung ? 'Rapat sedang berlangsung.' : 'Rapat belum dimulai. Mulai dari tab Ringkasan untuk menandai rapat berlangsung.'}</span>
      </div>

      <div className="card">
        <div className="card__head"><h3>🎥 Conference — {MODA_LABEL[rapat.moda]}</h3></div>
        <div className="card__body">
          {rapat.tautanRapat ? (
            <div className="row">
              <a className="btn btn--primary" href={rapat.tautanRapat} target="_blank" rel="noreferrer">▶️ Gabung Rapat (Zoom / Meet)</a>
              <button className="btn btn--ghost" onClick={() => navigator.clipboard?.writeText(rapat.tautanRapat!)}>📋 Salin tautan</button>
            </div>
          ) : (
            <p className="muted">Belum ada tautan rapat daring. Tambahkan via Edit rapat.</p>
          )}
          {!berlangsung && rapat.status === 'terjadwal' && (
            <button className="btn btn--success mt" onClick={() => aksi.setStatus(rapat.id, 'berlangsung')}>▶️ Mulai Rapat Sekarang</button>
          )}
          {berlangsung && (
            <button className="btn btn--danger mt" onClick={() => aksi.setStatus(rapat.id, 'selesai')}>⏹️ Akhiri Rapat</button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>📊 Presentasi / Paparan</h3></div>
        <div className="card__body">
          {paparan.length === 0 ? (
            <p className="muted">Belum ada bahan paparan. Tambahkan di tab Undangan (jenis: paparan).</p>
          ) : (
            <div className="list">
              {paparan.map((b) => (
                <div className="line-item" key={b.id}>
                  <span>📊</span>
                  <div style={{ flex: 1 }}><b>{b.nama}</b></div>
                  {b.tautan && <a className="btn btn--ghost btn--sm" href={b.tautan} target="_blank" rel="noreferrer">Buka</a>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card__head"><h3>⏺️ Recording & Transkripsi</h3></div>
        <div className="card__body">
          <p className="muted">
            Rekaman video (Zoom Recording) dan rekaman suara (Otter.ai) ditautkan ke rapat ini.
            Hasil transkripsi otomatis dapat diimpor pada tab <b>Notulensi</b> untuk menyusun ringkasan & Berita Acara.
          </p>
          <div className="row mt">
            <span className="chip">🎙️ Otter.ai — Speech-to-Text</span>
            <span className="chip">⏺️ Zoom Cloud Recording</span>
            <span className="chip">📝 {rapat.transkrip.length} segmen transkrip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
