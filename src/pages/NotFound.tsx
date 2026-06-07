import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="empty">
      <div className="empty__icon">🔍</div>
      <h2>Halaman tidak ditemukan</h2>
      <p className="muted">Tautan yang Anda tuju tidak tersedia.</p>
      <Link to="/" className="btn btn--primary mt">Kembali ke Beranda</Link>
    </div>
  )
}
