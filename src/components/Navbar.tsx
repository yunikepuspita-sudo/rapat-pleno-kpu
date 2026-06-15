import { NavLink } from 'react-router-dom'
import { usePleno, aksi } from '../pleno/store'
import { PERAN_LABEL } from '../pleno/types'
import InstallButton from './InstallButton'

/** Kumpulkan roster unik (id+nama+peran) dari seluruh rapat untuk pemilih user. */
function useRoster() {
  const { rapat } = usePleno()
  const map = new Map<string, { id: string; nama: string; peran: string }>()
  for (const r of rapat) {
    for (const p of r.peserta) {
      if (!map.has(p.id)) map.set(p.id, { id: p.id, nama: p.nama, peran: PERAN_LABEL[p.peran] })
    }
  }
  return [...map.values()]
}

export default function Navbar() {
  const { userId, peranSipleno } = usePleno()
  const roster = useRoster()

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <NavLink to="/" className="brand">
          <span className="brand__mark">🗳️</span>
          <span className="brand__name">
            Portal Pleno
            <small>Rapat Pleno KPU</small>
          </span>
        </NavLink>

        <nav className="navbar__links">
          <NavLink to="/" end>🏠 <span>Beranda</span></NavLink>
          {/* Dashboard Pemantauan hanya untuk peran Pemantau Provinsi (RBAC). */}
          {peranSipleno === 'provinsi' && (
            <NavLink to="/pemantauan">🛰️ <span>Pemantauan</span></NavLink>
          )}
          <NavLink to="/rapat">📋 <span>Rapat</span></NavLink>
          <NavLink to="/arsip">🗄️ <span>Arsip</span></NavLink>
          <NavLink to="/pengaturan">⚙️ <span>Setelan</span></NavLink>

          <label className="userpill" title="Peran SIPLENO (RBAC). Provinsi = pemantau lintas kabkota; Kabkota = operator pleno.">
            🛡️
            <select value={peranSipleno} onChange={(e) => aksi.setPeranSipleno(e.target.value as 'provinsi' | 'kabkota')}>
              <option value="provinsi">Pemantau Provinsi</option>
              <option value="kabkota">Operator Kabkota</option>
            </select>
          </label>

          <label className="userpill" title="Identitas Anda di perangkat ini (untuk presensi, voting & tanda tangan)">
            👤
            <select value={userId ?? ''} onChange={(e) => aksi.setUser(e.target.value || null)}>
              <option value="">Pilih identitas…</option>
              {roster.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nama} ({r.peran})
                </option>
              ))}
            </select>
          </label>

          <InstallButton />
        </nav>
      </div>
    </header>
  )
}
