// ──────────────────────────────────────────────────────────────────────────
// MVP SIPLENO — Sumber data Dashboard Pemantauan Provinsi.
//
// Dua mode (sesuai prinsip prototipe: jalan tanpa backend, lebih kaya dengan):
//   • PRODUKSI  — bila Supabase (self-hosted di server KPU) dikonfigurasi,
//                 ambil agregat dari VIEW `v_pemantauan_wilayah`.
//   • DEMO/LOKAL — bila backend belum aktif, pakai data contoh 27 kabkota yang
//                 deterministik agar dashboard langsung dapat ditampilkan.
//
// Skema & VIEW backend: supabase/migrations/0001_sipleno_mvp.sql
// ──────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseEnabled } from './supabase'
import { KABKOTA } from '../pemantauan/wilayah'
import type { RekapWilayah } from '../pemantauan/agregasi'

/** PRNG deterministik kecil (mulberry32) — agar data contoh stabil antar-render. */
function rng(seed: number): () => number {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function isoHariLalu(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

/** Bangun data contoh 27 kabkota yang realistis & deterministik. */
function rekapContoh(): RekapWilayah[] {
  return KABKOTA.map((w, i) => {
    const r = rng(parseInt(w.kode, 10) + i)
    // ~85% kabkota sudah aktif memakai sistem (sisanya "belum sinkron").
    const aktif = r() > 0.15
    if (!aktif) {
      return {
        ...w,
        aktif: false,
        totalRapat: 0,
        terjadwal: 0,
        berlangsung: 0,
        selesai: 0,
        baFinal: 0,
        tindakLanjutTotal: 0,
        tindakLanjutSelesai: 0,
        kuorumTerakhir: null,
        rapatTerakhir: null,
        diperbaruiPada: null,
      }
    }
    const selesai = 2 + Math.floor(r() * 8)
    const berlangsung = r() > 0.7 ? 1 : 0
    const terjadwal = 1 + Math.floor(r() * 4)
    const totalRapat = selesai + berlangsung + terjadwal
    const baFinal = Math.max(0, selesai - Math.floor(r() * 2))
    const tindakLanjutTotal = selesai * (1 + Math.floor(r() * 3))
    const tindakLanjutSelesai = Math.floor(tindakLanjutTotal * (0.4 + r() * 0.5))
    return {
      ...w,
      aktif: true,
      totalRapat,
      terjadwal,
      berlangsung,
      selesai,
      baFinal,
      tindakLanjutTotal,
      tindakLanjutSelesai,
      kuorumTerakhir: r() > 0.1,
      rapatTerakhir: isoHariLalu(Math.floor(r() * 30)),
      diperbaruiPada: new Date(Date.now() - Math.floor(r() * 86400000)).toISOString(),
    }
  })
}

/**
 * Ambil rekap pemantauan 27 kabkota.
 * @returns daftar RekapWilayah dan penanda apakah sumbernya backend nyata.
 */
export async function sumberPemantauan(): Promise<{
  rekap: RekapWilayah[]
  sumber: 'backend' | 'demo'
}> {
  if (isSupabaseEnabled && supabase) {
    const { data, error } = await supabase
      .from('v_pemantauan_wilayah')
      .select('*')
      .neq('jenis', 'provinsi')
    if (!error && data) {
      const rekap: RekapWilayah[] = data.map((row: Record<string, unknown>) => ({
        kode: String(row.kode),
        nama: String(row.nama),
        jenis: row.jenis as RekapWilayah['jenis'],
        aktif: Boolean(row.aktif),
        totalRapat: Number(row.total_rapat ?? 0),
        terjadwal: Number(row.terjadwal ?? 0),
        berlangsung: Number(row.berlangsung ?? 0),
        selesai: Number(row.selesai ?? 0),
        baFinal: Number(row.ba_final ?? 0),
        tindakLanjutTotal: Number(row.tindak_lanjut_total ?? 0),
        tindakLanjutSelesai: Number(row.tindak_lanjut_selesai ?? 0),
        kuorumTerakhir: row.kuorum_terakhir == null ? null : Boolean(row.kuorum_terakhir),
        rapatTerakhir: row.rapat_terakhir ? String(row.rapat_terakhir) : null,
        diperbaruiPada: row.diperbarui_pada ? String(row.diperbarui_pada) : null,
      }))
      return { rekap, sumber: 'backend' }
    }
    // Bila query gagal (mis. VIEW belum dibuat), jatuh ke data contoh.
  }
  return { rekap: rekapContoh(), sumber: 'demo' }
}
