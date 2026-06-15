import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import DashboardPemantauan from './pages/DashboardPemantauan'
import RapatList from './pages/RapatList'
import RapatForm from './pages/RapatForm'
import RapatDetail from './pages/RapatDetail'
import Hadir from './pages/Hadir'
import Arsip from './pages/Arsip'
import Pengaturan from './pages/Pengaturan'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Halaman check-in QR tampil layar penuh tanpa navbar. */}
      <Route path="/hadir/:id" element={<Hadir />} />
      <Route
        path="*"
        element={
          <div className="app-shell">
            <Navbar />
            <main className="content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/pemantauan" element={<DashboardPemantauan />} />
                <Route path="/rapat" element={<RapatList />} />
                <Route path="/rapat/baru" element={<RapatForm />} />
                <Route path="/rapat/:id/edit" element={<RapatForm />} />
                <Route path="/rapat/:id" element={<RapatDetail />} />
                <Route path="/arsip" element={<Arsip />} />
                <Route path="/pengaturan" element={<Pengaturan />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        }
      />
    </Routes>
  )
}
