import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { aksi, getRapat, usePleno } from '../pleno/store'
import { uid } from '../pleno/utils'
import {
  MODA_LABEL,
  PERAN_LABEL,
  type ModaRapat,
  type Peran,
  type ButirAgenda,
  type Peserta,
} from '../pleno/types'

export default function RapatForm() {
  const { id } = useParams()
  usePleno() // re-render on store changes
  const nav = useNavigate()
  const existing = id ? getRapat(id) : undefined
  const isEdit = Boolean(existing)

  const [f, setF] = useState({
    nomor: existing?.nomor ?? '',
    judul: existing?.judul ?? '',
    tanggal: existing?.tanggal ?? new Date().toISOString().slice(0, 10),
    waktuMulai: existing?.waktuMulai ?? '09:00',
    waktuSelesai: existing?.waktuSelesai ?? '',
    lokasi: existing?.lokasi ?? '',
    moda: (existing?.moda ?? 'hybrid') as ModaRapat,
    tautanRapat: existing?.tautanRapat ?? '',
  })
  const [agenda, setAgenda] = useState<ButirAgenda[]>(existing?.agenda ?? [])
  const [peserta, setPeserta] = useState<Peserta[]>(existing?.peserta ?? [])
  const [agJudul, setAgJudul] = useState('')
  const [psNama, setPsNama] = useState('')
  const [psJabatan, setPsJabatan] = useState('')
  const [psPeran, setPsPeran] = useState<Peran>('anggota')
  const [psWa, setPsWa] = useState('')

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((s) => ({ ...s, [k]: v }))
  }

  function simpan() {
    if (!f.judul.trim()) {
      alert('Judul rapat wajib diisi.')
      return
    }
    if (isEdit && existing) {
      aksi.perbaruiRapat(existing.id, { ...f, agenda, peserta })
      nav(`/rapat/${existing.id}`)
    } else {
      const r = aksi.buatRapat({ ...f, agenda, peserta, status: 'terjadwal' })
      nav(`/rapat/${r.id}`)
    }
  }

  function tambahAgenda() {
    if (!agJudul.trim()) return
    setAgenda((a) => [...a, { id: uid('a-'), judul: agJudul.trim() }])
    setAgJudul('')
  }
  function tambahPeserta() {
    if (!psNama.trim()) return
    setPeserta((p) => [
      ...p,
      { id: uid('p-'), nama: psNama.trim(), jabatan: psJabatan.trim(), peran: psPeran, whatsapp: psWa.trim() || undefined },
    ])
    setPsNama('')
    setPsJabatan('')
    setPsWa('')
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{isEdit ? 'Edit Rapat Pleno' : 'Jadwalkan Rapat Pleno'}</h1>
          <p>Tahap persiapan: agenda, jadwal, peserta, dan bahan rapat.</p>
        </div>
        <Link to={isEdit ? `/rapat/${id}` : '/rapat'} className="btn btn--ghost">Batal</Link>
      </div>

      <div className="card">
        <div className="card__head"><h3>📋 Informasi Rapat</h3></div>
        <div className="card__body">
          <div className="form-grid">
            <div className="field full">
              <label>Judul / Acara Pleno *</label>
              <input value={f.judul} onChange={(e) => set('judul', e.target.value)} placeholder="mis. Pleno Penetapan DPT" />
            </div>
            <div className="field">
              <label>Nomor Pleno</label>
              <input value={f.nomor} onChange={(e) => set('nomor', e.target.value)} placeholder="018/PL.02.6-BA/3404/2026" />
            </div>
            <div className="field">
              <label>Moda Pelaksanaan</label>
              <select value={f.moda} onChange={(e) => set('moda', e.target.value as ModaRapat)}>
                {Object.entries(MODA_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Tanggal</label>
              <input type="date" value={f.tanggal} onChange={(e) => set('tanggal', e.target.value)} />
            </div>
            <div className="field">
              <label>Waktu Mulai</label>
              <input type="time" value={f.waktuMulai} onChange={(e) => set('waktuMulai', e.target.value)} />
            </div>
            <div className="field">
              <label>Waktu Selesai (perkiraan)</label>
              <input type="time" value={f.waktuSelesai} onChange={(e) => set('waktuSelesai', e.target.value)} />
            </div>
            <div className="field">
              <label>Lokasi</label>
              <input value={f.lokasi} onChange={(e) => set('lokasi', e.target.value)} placeholder="Aula KPU…" />
            </div>
            <div className="field full">
              <label>Tautan Rapat Daring (Zoom / Google Meet)</label>
              <input value={f.tautanRapat} onChange={(e) => set('tautanRapat', e.target.value)} placeholder="https://…" />
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-lg">
        <div className="card__head"><h3>🗒️ Agenda Pleno ({agenda.length})</h3></div>
        <div className="card__body">
          <div className="list">
            {agenda.map((a, i) => (
              <div className="line-item" key={a.id}>
                <span className="line-item__num">{i + 1}</span>
                <span style={{ flex: 1 }}>{a.judul}</span>
                <button className="btn btn--danger btn--sm" onClick={() => setAgenda((x) => x.filter((y) => y.id !== a.id))}>Hapus</button>
              </div>
            ))}
          </div>
          <div className="row mt">
            <input style={{ flex: 1, border: '1.5px solid var(--border)', borderRadius: 9, padding: '10px 12px' }}
              placeholder="Tambah butir agenda…" value={agJudul}
              onChange={(e) => setAgJudul(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && tambahAgenda()} />
            <button className="btn btn--ghost" onClick={tambahAgenda}>＋ Tambah</button>
          </div>
        </div>
      </div>

      <div className="card mt-lg">
        <div className="card__head"><h3>👥 Peserta / Undangan ({peserta.length})</h3></div>
        <div className="card__body">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Nama</th><th>Jabatan</th><th>Peran</th><th>WhatsApp</th><th></th></tr></thead>
              <tbody>
                {peserta.map((p) => (
                  <tr key={p.id}>
                    <td>{p.nama}</td>
                    <td>{p.jabatan || '-'}</td>
                    <td><span className="badge badge--blue">{PERAN_LABEL[p.peran]}</span></td>
                    <td>{p.whatsapp || '-'}</td>
                    <td><button className="btn btn--danger btn--sm" onClick={() => setPeserta((x) => x.filter((y) => y.id !== p.id))}>Hapus</button></td>
                  </tr>
                ))}
                {peserta.length === 0 && <tr><td colSpan={5} className="muted center">Belum ada peserta.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="form-grid mt">
            <div className="field"><label>Nama</label><input value={psNama} onChange={(e) => setPsNama(e.target.value)} /></div>
            <div className="field"><label>Jabatan</label><input value={psJabatan} onChange={(e) => setPsJabatan(e.target.value)} /></div>
            <div className="field"><label>Peran</label>
              <select value={psPeran} onChange={(e) => setPsPeran(e.target.value as Peran)}>
                {Object.entries(PERAN_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="field"><label>WhatsApp (628…)</label><input value={psWa} onChange={(e) => setPsWa(e.target.value)} placeholder="628xxx" /></div>
          </div>
          <button className="btn btn--ghost" onClick={tambahPeserta}>＋ Tambah Peserta</button>
        </div>
      </div>

      <div className="row mt-lg">
        <button className="btn btn--primary" onClick={simpan}>{isEdit ? '💾 Simpan Perubahan' : '✅ Jadwalkan Rapat'}</button>
        <Link to={isEdit ? `/rapat/${id}` : '/rapat'} className="btn btn--ghost">Batal</Link>
      </div>
    </>
  )
}
