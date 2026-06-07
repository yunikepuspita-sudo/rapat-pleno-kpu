// Data contoh (seed) bertema KPU agar aplikasi langsung dapat dicoba.

import type { Rapat, ProfilLembaga } from './types'

export function profilDefault(): ProfilLembaga {
  return {
    namaLembaga: 'Komisi Pemilihan Umum',
    satuanKerja: 'KPU Kabupaten Sleman',
    alamat: 'Jl. Parasamya No. 1, Beran, Tridadi, Sleman, D.I. Yogyakarta',
    logoEmoji: '🗳️',
  }
}

// Tujuh komisioner + sekretaris — komposisi khas KPU kabupaten/kota.
function komisioner() {
  return [
    { id: 'p-ketua', nama: 'Drs. H. Bambang Wijonarko', jabatan: 'Ketua KPU', peran: 'ketua' as const, whatsapp: '628111000001' },
    { id: 'p-div1', nama: 'Siti Rahmawati, S.H.', jabatan: 'Divisi Teknis Penyelenggaraan', peran: 'anggota' as const, whatsapp: '628111000002' },
    { id: 'p-div2', nama: 'Agus Santoso, S.IP.', jabatan: 'Divisi Perencanaan & Data', peran: 'anggota' as const, whatsapp: '628111000003' },
    { id: 'p-div3', nama: 'Dewi Lestari, M.Si.', jabatan: 'Divisi Sosialisasi & Parmas', peran: 'anggota' as const, whatsapp: '628111000004' },
    { id: 'p-div4', nama: 'Rudi Hartono, S.E.', jabatan: 'Divisi Hukum & Pengawasan', peran: 'anggota' as const, whatsapp: '628111000005' },
    { id: 'p-sekretaris', nama: 'Endang Purwati, S.Sos.', jabatan: 'Sekretaris', peran: 'sekretaris' as const, whatsapp: '628111000006' },
  ]
}

export function seedRapat(): Rapat[] {
  const now = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const plus = (n: number) => {
    const d = new Date(now)
    d.setDate(d.getDate() + n)
    return iso(d)
  }

  // ── Rapat 1: SELESAI + lengkap (untuk demo BA & arsip) ──────────────────────
  const r1: Rapat = {
    id: 'r-demo-1',
    nomor: '018/PL.02.6-BA/3404/2026',
    judul: 'Penetapan Rekapitulasi Hasil Pemungutan Suara Tingkat Kabupaten',
    tanggal: plus(-7),
    waktuMulai: '09:00',
    waktuSelesai: '12:30',
    lokasi: 'Aula KPU Kabupaten Sleman',
    moda: 'hybrid',
    tautanRapat: 'https://us02web.zoom.us/j/0000000000',
    status: 'selesai',
    agenda: [
      { id: 'a1', judul: 'Pembukaan dan pembacaan tata tertib pleno' },
      { id: 'a2', judul: 'Pemaparan hasil rekapitulasi per kecamatan' },
      { id: 'a3', judul: 'Pencermatan dan tanggapan saksi & Bawaslu' },
      { id: 'a4', judul: 'Pengambilan keputusan penetapan hasil' },
      { id: 'a5', judul: 'Penandatanganan Berita Acara' },
    ],
    peserta: komisioner(),
    bahan: [
      { id: 'b1', nama: 'Tata Tertib Rapat Pleno', jenis: 'agenda', tautan: 'https://drive.google.com' },
      { id: 'b2', nama: 'Rekapitulasi DA1 per Kecamatan', jenis: 'paparan', tautan: 'https://drive.google.com' },
      { id: 'b3', nama: 'Lampiran Sertifikat Hasil', jenis: 'lampiran', tautan: 'https://drive.google.com' },
    ],
    presensi: [
      { pesertaId: 'p-ketua', status: 'hadir', metode: 'qr', waktu: new Date(now.getTime() - 7 * 864e5).toISOString() },
      { pesertaId: 'p-div1', status: 'hadir', metode: 'qr', waktu: new Date(now.getTime() - 7 * 864e5).toISOString() },
      { pesertaId: 'p-div2', status: 'hadir', metode: 'manual' },
      { pesertaId: 'p-div3', status: 'hadir', metode: 'qr' },
      { pesertaId: 'p-div4', status: 'hadir', metode: 'qr' },
      { pesertaId: 'p-sekretaris', status: 'hadir', metode: 'manual' },
    ],
    voting: [
      {
        id: 'v1',
        pertanyaan: 'Menyetujui penetapan rekapitulasi hasil pemungutan suara tingkat kabupaten?',
        opsi: [
          { id: 'o1', teks: 'Setuju' },
          { id: 'o2', teks: 'Tidak Setuju' },
          { id: 'o3', teks: 'Abstain' },
        ],
        status: 'ditutup',
        rahasia: false,
        suara: { 'p-ketua': 'o1', 'p-div1': 'o1', 'p-div2': 'o1', 'p-div3': 'o1', 'p-div4': 'o3' },
        dibukaPada: new Date(now.getTime() - 7 * 864e5).toISOString(),
        ditutupPada: new Date(now.getTime() - 7 * 864e5).toISOString(),
      },
    ],
    transkrip: [
      { id: 's1', pembicara: 'Ketua', waktu: '00:00', teks: 'Membuka rapat pleno terbuka rekapitulasi hasil penghitungan suara tingkat kabupaten dan membacakan tata tertib.' },
      { id: 's2', pembicara: 'Divisi Teknis', waktu: '05:30', teks: 'Memaparkan rekapitulasi DA1 dari 17 kecamatan beserta data partisipasi pemilih.' },
      { id: 's3', pembicara: 'Saksi', waktu: '40:10', teks: 'Mengajukan pencermatan atas selisih data di dua TPS, kemudian disepakati pembetulan administratif.' },
      { id: 's4', pembicara: 'Bawaslu', waktu: '58:00', teks: 'Menyatakan tidak ada keberatan atas hasil rekapitulasi setelah pembetulan.' },
      { id: 's5', pembicara: 'Ketua', waktu: '72:00', teks: 'Membuka pengambilan keputusan dan menetapkan hasil rekapitulasi melalui musyawarah dan pemungutan suara.' },
    ],
    notulensi: {
      ringkasan:
        'Rapat pleno terbuka menetapkan rekapitulasi hasil pemungutan suara tingkat kabupaten setelah pemaparan data 17 kecamatan, pencermatan saksi, dan pernyataan Bawaslu. Pembetulan administratif pada dua TPS disepakati sebelum penetapan.',
      poinPembahasan: [
        'Pemaparan rekapitulasi DA1 dari seluruh 17 kecamatan.',
        'Pencermatan saksi atas selisih data di dua TPS.',
        'Pembetulan administratif disepakati bersama.',
        'Bawaslu menyatakan tidak ada keberatan.',
      ],
      keputusan: [
        'Menetapkan rekapitulasi hasil pemungutan suara tingkat kabupaten sebagaimana lampiran.',
        'Pembetulan administratif pada dua TPS dinyatakan sah.',
      ],
      tindakLanjut: [
        { id: 'tl1', uraian: 'Mengunggah Berita Acara dan lampiran ke Sirekap.', penanggungJawab: 'Divisi Teknis Penyelenggaraan', tenggat: plus(-5), status: 'selesai' },
        { id: 'tl2', uraian: 'Mendistribusikan salinan BA kepada saksi dan Bawaslu.', penanggungJawab: 'Sekretaris', tenggat: plus(-4), status: 'selesai' },
        { id: 'tl3', uraian: 'Mengarsipkan dokumen pleno secara elektronik.', penanggungJawab: 'Sekretaris', tenggat: plus(2), status: 'proses' },
      ],
      dibuatPada: new Date(now.getTime() - 7 * 864e5).toISOString(),
      sumber: 'ai',
    },
    beritaAcara: {
      nomor: '018/PL.02.6-BA/3404/2026',
      isi: '', // diisi generator saat dibuka
      status: 'final',
      tandaTangan: [
        { pesertaId: 'p-ketua', peran: 'ketua', ditandatangani: true, waktu: new Date(now.getTime() - 6 * 864e5).toISOString() },
        { pesertaId: 'p-div1', peran: 'anggota', ditandatangani: true, waktu: new Date(now.getTime() - 6 * 864e5).toISOString() },
        { pesertaId: 'p-div2', peran: 'anggota', ditandatangani: true },
        { pesertaId: 'p-div3', peran: 'anggota', ditandatangani: true },
        { pesertaId: 'p-div4', peran: 'anggota', ditandatangani: true },
        { pesertaId: 'p-sekretaris', peran: 'sekretaris', ditandatangani: true },
      ],
      dibuatPada: new Date(now.getTime() - 7 * 864e5).toISOString(),
      difinalkanPada: new Date(now.getTime() - 6 * 864e5).toISOString(),
    },
    dibuatPada: new Date(now.getTime() - 10 * 864e5).toISOString(),
    diperbaruiPada: new Date(now.getTime() - 6 * 864e5).toISOString(),
  }

  // ── Rapat 2: TERJADWAL (untuk demo persiapan, undangan, presensi) ───────────
  const r2: Rapat = {
    id: 'r-demo-2',
    nomor: '021/PL.01.2-BA/3404/2026',
    judul: 'Pleno Penetapan Daftar Pemilih Tetap (DPT) Pemilihan',
    tanggal: plus(3),
    waktuMulai: '13:00',
    waktuSelesai: '16:00',
    lokasi: 'Ruang Rapat Lantai 2 KPU Kabupaten Sleman',
    moda: 'hybrid',
    tautanRapat: 'https://meet.google.com/abc-defg-hij',
    status: 'terjadwal',
    agenda: [
      { id: 'a1', judul: 'Pembukaan oleh Ketua' },
      { id: 'a2', judul: 'Pemaparan hasil pemutakhiran data pemilih', keterangan: 'Divisi Perencanaan & Data' },
      { id: 'a3', judul: 'Tanggapan peserta rapat' },
      { id: 'a4', judul: 'Penetapan DPT' },
      { id: 'a5', judul: 'Penutup' },
    ],
    peserta: komisioner(),
    bahan: [
      { id: 'b1', nama: 'Bahan Paparan DPT', jenis: 'paparan', tautan: 'https://drive.google.com' },
      { id: 'b2', nama: 'Rekap DPSHP Akhir', jenis: 'lampiran', tautan: 'https://drive.google.com' },
    ],
    presensi: [],
    voting: [],
    transkrip: [],
    dibuatPada: new Date(now.getTime() - 1 * 864e5).toISOString(),
    diperbaruiPada: new Date(now.getTime() - 1 * 864e5).toISOString(),
  }

  return [r2, r1]
}
