// ──────────────────────────────────────────────────────────────────────────
// MVP SIPLENO — Daftar wilayah KPU Provinsi Jawa Barat.
//
// 1 KPU Provinsi + 27 KPU Kabupaten/Kota (18 kabupaten + 9 kota).
// Setiap wilayah = satu "tenant" pada arsitektur multi-tenant. Kode wilayah
// mengikuti pola kode wilayah administrasi (BPS/Kemendagri) untuk Jawa Barat.
// ──────────────────────────────────────────────────────────────────────────

export type JenisWilayah = 'provinsi' | 'kabupaten' | 'kota'

export interface Wilayah {
  /** Kode tenant (unik). */
  kode: string
  nama: string
  jenis: JenisWilayah
}

/** KPU Provinsi Jawa Barat (tenant pemantau / agregator). */
export const PROVINSI: Wilayah = { kode: '32', nama: 'Provinsi Jawa Barat', jenis: 'provinsi' }

/** 27 KPU Kabupaten/Kota di Jawa Barat (tenant pelaksana pleno). */
export const KABKOTA: Wilayah[] = [
  { kode: '3201', nama: 'Kabupaten Bogor', jenis: 'kabupaten' },
  { kode: '3202', nama: 'Kabupaten Sukabumi', jenis: 'kabupaten' },
  { kode: '3203', nama: 'Kabupaten Cianjur', jenis: 'kabupaten' },
  { kode: '3204', nama: 'Kabupaten Bandung', jenis: 'kabupaten' },
  { kode: '3205', nama: 'Kabupaten Garut', jenis: 'kabupaten' },
  { kode: '3206', nama: 'Kabupaten Tasikmalaya', jenis: 'kabupaten' },
  { kode: '3207', nama: 'Kabupaten Ciamis', jenis: 'kabupaten' },
  { kode: '3208', nama: 'Kabupaten Kuningan', jenis: 'kabupaten' },
  { kode: '3209', nama: 'Kabupaten Cirebon', jenis: 'kabupaten' },
  { kode: '3210', nama: 'Kabupaten Majalengka', jenis: 'kabupaten' },
  { kode: '3211', nama: 'Kabupaten Sumedang', jenis: 'kabupaten' },
  { kode: '3212', nama: 'Kabupaten Indramayu', jenis: 'kabupaten' },
  { kode: '3213', nama: 'Kabupaten Subang', jenis: 'kabupaten' },
  { kode: '3214', nama: 'Kabupaten Purwakarta', jenis: 'kabupaten' },
  { kode: '3215', nama: 'Kabupaten Karawang', jenis: 'kabupaten' },
  { kode: '3216', nama: 'Kabupaten Bekasi', jenis: 'kabupaten' },
  { kode: '3217', nama: 'Kabupaten Bandung Barat', jenis: 'kabupaten' },
  { kode: '3218', nama: 'Kabupaten Pangandaran', jenis: 'kabupaten' },
  { kode: '3271', nama: 'Kota Bogor', jenis: 'kota' },
  { kode: '3272', nama: 'Kota Sukabumi', jenis: 'kota' },
  { kode: '3273', nama: 'Kota Bandung', jenis: 'kota' },
  { kode: '3274', nama: 'Kota Cirebon', jenis: 'kota' },
  { kode: '3275', nama: 'Kota Bekasi', jenis: 'kota' },
  { kode: '3276', nama: 'Kota Depok', jenis: 'kota' },
  { kode: '3277', nama: 'Kota Cimahi', jenis: 'kota' },
  { kode: '3278', nama: 'Kota Tasikmalaya', jenis: 'kota' },
  { kode: '3279', nama: 'Kota Banjar', jenis: 'kota' },
]

/** Seluruh tenant (provinsi + 27 kabkota). */
export const SEMUA_WILAYAH: Wilayah[] = [PROVINSI, ...KABKOTA]

export function cariWilayah(kode: string): Wilayah | undefined {
  return SEMUA_WILAYAH.find((w) => w.kode === kode)
}
