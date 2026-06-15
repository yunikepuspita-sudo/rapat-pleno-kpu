// ──────────────────────────────────────────────────────────────────────────
// MVP SIPLENO — Model & agregasi data pemantauan provinsi.
//
// `RekapWilayah` adalah ringkasan per kabkota yang ditampilkan di Dashboard
// Pemantauan Provinsi. Agregasi total provinsi dihitung dari 27 rekap kabkota.
//
// Sumber data: `sumberPemantauan()` di lib/pemantauan.ts — memakai backend
// (Supabase self-hosted) bila dikonfigurasi, atau data contoh lokal bila belum.
// ──────────────────────────────────────────────────────────────────────────

import type { JenisWilayah } from './wilayah'

/** Ringkasan satu kabupaten/kota untuk pemantauan provinsi. */
export interface RekapWilayah {
  kode: string
  nama: string
  jenis: JenisWilayah
  /** Apakah kabkota sudah memakai sistem (mengirim data). */
  aktif: boolean
  totalRapat: number
  terjadwal: number
  berlangsung: number
  selesai: number
  baFinal: number
  tindakLanjutTotal: number
  tindakLanjutSelesai: number
  /** Hasil kuorum rapat terakhir (jika ada). */
  kuorumTerakhir: boolean | null
  /** Tanggal rapat terakhir (ISO YYYY-MM-DD). */
  rapatTerakhir: string | null
  /** Timestamp sinkronisasi data terakhir (ISO). */
  diperbaruiPada: string | null
}

/** Agregat tingkat provinsi atas seluruh kabkota. */
export interface RekapProvinsi {
  totalKabkota: number
  kabkotaAktif: number
  totalRapat: number
  berlangsung: number
  selesai: number
  baFinal: number
  tindakLanjutTotal: number
  tindakLanjutSelesai: number
}

export function agregatProvinsi(rekap: RekapWilayah[]): RekapProvinsi {
  return rekap.reduce<RekapProvinsi>(
    (acc, w) => ({
      totalKabkota: acc.totalKabkota + 1,
      kabkotaAktif: acc.kabkotaAktif + (w.aktif ? 1 : 0),
      totalRapat: acc.totalRapat + w.totalRapat,
      berlangsung: acc.berlangsung + w.berlangsung,
      selesai: acc.selesai + w.selesai,
      baFinal: acc.baFinal + w.baFinal,
      tindakLanjutTotal: acc.tindakLanjutTotal + w.tindakLanjutTotal,
      tindakLanjutSelesai: acc.tindakLanjutSelesai + w.tindakLanjutSelesai,
    }),
    {
      totalKabkota: 0,
      kabkotaAktif: 0,
      totalRapat: 0,
      berlangsung: 0,
      selesai: 0,
      baFinal: 0,
      tindakLanjutTotal: 0,
      tindakLanjutSelesai: 0,
    },
  )
}

/** Tindak lanjut yang masih outstanding (belum selesai). */
export function tindakLanjutTertunda(w: RekapWilayah): number {
  return Math.max(0, w.tindakLanjutTotal - w.tindakLanjutSelesai)
}
