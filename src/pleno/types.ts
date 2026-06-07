// ──────────────────────────────────────────────────────────────────────────
// Model data Portal Rapat Pleno KPU.
//
// Seluruh alur kerja pleno — dari persiapan, undangan, presensi, pelaksanaan,
// notulensi, voting, penyusunan Berita Acara, penandatanganan, hingga arsip —
// direpresentasikan oleh tipe-tipe di bawah ini. Data disimpan di localStorage
// (lihat store.ts) sehingga aplikasi berjalan penuh secara luring.
// ──────────────────────────────────────────────────────────────────────────

/** Peran peserta dalam rapat pleno. */
export type Peran = 'ketua' | 'anggota' | 'sekretaris' | 'peserta'

export const PERAN_LABEL: Record<Peran, string> = {
  ketua: 'Ketua',
  anggota: 'Anggota',
  sekretaris: 'Sekretaris',
  peserta: 'Peserta',
}

/** Moda pelaksanaan rapat. */
export type ModaRapat = 'luring' | 'daring' | 'hybrid'

export const MODA_LABEL: Record<ModaRapat, string> = {
  luring: 'Luring (Tatap Muka)',
  daring: 'Daring (Online)',
  hybrid: 'Hybrid',
}

/** Status siklus hidup sebuah rapat pleno. */
export type StatusRapat =
  | 'draft'
  | 'terjadwal'
  | 'berlangsung'
  | 'selesai'
  | 'diarsipkan'

export const STATUS_LABEL: Record<StatusRapat, string> = {
  draft: 'Draft',
  terjadwal: 'Terjadwal',
  berlangsung: 'Berlangsung',
  selesai: 'Selesai',
  diarsipkan: 'Diarsipkan',
}

/** Satu butir agenda pleno. */
export interface ButirAgenda {
  id: string
  judul: string
  keterangan?: string
}

/** Peserta / undangan rapat. */
export interface Peserta {
  id: string
  nama: string
  jabatan: string
  peran: Peran
  email?: string
  whatsapp?: string
}

/** Status presensi seorang peserta. */
export type StatusHadir = 'hadir' | 'izin' | 'tidak-hadir'

export interface Presensi {
  pesertaId: string
  status: StatusHadir
  waktu?: string // ISO timestamp saat check-in
  metode?: 'qr' | 'manual'
  catatan?: string
}

/** Bahan / lampiran rapat (dokumen). */
export interface Bahan {
  id: string
  nama: string
  jenis: 'agenda' | 'paparan' | 'lampiran' | 'rujukan'
  tautan?: string // URL Google Drive / repositori dokumen
  keterangan?: string
}

/** Satu pilihan dalam pemungutan suara. */
export interface OpsiVoting {
  id: string
  teks: string
}

export type StatusVoting = 'draft' | 'dibuka' | 'ditutup'

/** Sesi pemungutan suara (Mentimeter/Slido style). */
export interface Voting {
  id: string
  pertanyaan: string
  opsi: OpsiVoting[]
  status: StatusVoting
  rahasia: boolean // suara anonim?
  // pesertaId -> opsiId (untuk voting tidak rahasia, mencegah suara ganda)
  suara: Record<string, string>
  dibukaPada?: string
  ditutupPada?: string
}

/** Segmen transkrip (hasil Otter.ai / notulis). */
export interface SegmenTranskrip {
  id: string
  pembicara: string
  waktu?: string // mm:ss
  teks: string
}

/** Hasil notulensi otomatis (ringkasan AI). */
export interface Notulensi {
  ringkasan: string
  poinPembahasan: string[]
  keputusan: string[]
  tindakLanjut: TindakLanjut[]
  dibuatPada?: string
  sumber?: 'ai' | 'lokal' | 'manual'
}

/** Item tindak lanjut keputusan pleno (untuk monitoring). */
export interface TindakLanjut {
  id: string
  uraian: string
  penanggungJawab?: string
  tenggat?: string // ISO date
  status: 'belum' | 'proses' | 'selesai'
}

/** Tanda tangan / persetujuan pada Berita Acara. */
export interface TandaTangan {
  pesertaId: string
  peran: Peran
  ditandatangani: boolean
  waktu?: string
}

export type StatusBA = 'belum' | 'draft' | 'review' | 'final'

/** Berita Acara Pleno. */
export interface BeritaAcara {
  nomor: string
  isi: string // naskah BA (markdown sederhana)
  status: StatusBA
  tandaTangan: TandaTangan[]
  dibuatPada?: string
  difinalkanPada?: string
}

/** Entitas inti: satu Rapat Pleno beserta seluruh jejak digitalnya. */
export interface Rapat {
  id: string
  nomor: string // nomor pleno, mis. "012/PL/KPU-KAB/VI/2026"
  judul: string
  tanggal: string // ISO date (YYYY-MM-DD)
  waktuMulai: string // "HH:MM"
  waktuSelesai?: string
  lokasi: string
  moda: ModaRapat
  tautanRapat?: string // link Zoom/Google Meet
  status: StatusRapat
  agenda: ButirAgenda[]
  peserta: Peserta[]
  bahan: Bahan[]
  presensi: Presensi[]
  voting: Voting[]
  transkrip: SegmenTranskrip[]
  notulensi?: Notulensi
  beritaAcara?: BeritaAcara
  dibuatPada: string
  diperbaruiPada: string
}

/** Profil lembaga (untuk kop/identitas BA). */
export interface ProfilLembaga {
  namaLembaga: string
  satuanKerja: string
  alamat: string
  logoEmoji: string
}
