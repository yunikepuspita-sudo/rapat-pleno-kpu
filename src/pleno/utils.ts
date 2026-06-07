// Utilitas umum: id, format tanggal/waktu, dan helper kuorum.

import type { Rapat, Presensi, Voting } from './types'

/** ID acak ringkas (cukup untuk data lokal). */
export function uid(prefix = ''): string {
  const rnd = Math.random().toString(36).slice(2, 8)
  const t = Date.now().toString(36).slice(-4)
  return `${prefix}${t}${rnd}`
}

const HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

/** "2026-06-07" → "Minggu, 7 Juni 2026". */
export function formatTanggal(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

/** Versi ringkas: "7 Jun 2026". */
export function formatTanggalSingkat(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''))
  if (isNaN(d.getTime())) return iso
  return `${d.getDate()} ${BULAN[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** ISO timestamp → "07/06/2026 14:30". */
export function formatWaktu(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`
}

/** Tanggal hari ini dalam format YYYY-MM-DD. */
export function hariIni(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Rekap presensi sebuah rapat. */
export function rekapPresensi(rapat: Rapat) {
  const total = rapat.peserta.length
  const byId = new Map(rapat.presensi.map((p) => [p.pesertaId, p]))
  let hadir = 0
  let izin = 0
  for (const p of rapat.peserta) {
    const pr = byId.get(p.id)
    if (pr?.status === 'hadir') hadir++
    else if (pr?.status === 'izin') izin++
  }
  const tidakHadir = total - hadir - izin
  // Kuorum sederhana: lebih dari separuh peserta hadir.
  const kuorum = total > 0 && hadir > total / 2
  const ambangKuorum = Math.floor(total / 2) + 1
  return { total, hadir, izin, tidakHadir, kuorum, ambangKuorum }
}

/** Status presensi seorang peserta (default tidak-hadir). */
export function statusPresensi(rapat: Rapat, pesertaId: string): Presensi {
  return (
    rapat.presensi.find((p) => p.pesertaId === pesertaId) ?? {
      pesertaId,
      status: 'tidak-hadir',
    }
  )
}

/** Rekap perolehan suara sebuah voting. */
export function rekapVoting(v: Voting) {
  const hitung: Record<string, number> = {}
  for (const o of v.opsi) hitung[o.id] = 0
  for (const opsiId of Object.values(v.suara)) {
    if (hitung[opsiId] !== undefined) hitung[opsiId]++
  }
  const total = Object.values(hitung).reduce((a, b) => a + b, 0)
  let menang: string | null = null
  let max = -1
  let seri = false
  for (const o of v.opsi) {
    if (hitung[o.id] > max) {
      max = hitung[o.id]
      menang = o.id
      seri = false
    } else if (hitung[o.id] === max && max > 0) {
      seri = true
    }
  }
  return { hitung, total, menang: seri ? null : menang, seri }
}

/** Persentase aman (0 bila pembagi 0). */
export function persen(bagian: number, total: number): number {
  return total > 0 ? Math.round((bagian / total) * 100) : 0
}
