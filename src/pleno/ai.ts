// ──────────────────────────────────────────────────────────────────────────
// Generator Notulensi & Berita Acara.
//
// Dua jalur:
//   1. LOKAL (default)  — deterministik, berjalan luring tanpa kunci API.
//   2. AI Claude        — opsional, via Supabase Edge Function `pleno-ai`
//                         (kunci ANTHROPIC_API_KEY disimpan di server).
//
// Notulensi otomatis menggabungkan transkrip, dan Berita Acara menggabungkan
// agenda + daftar hadir + hasil voting + keputusan menjadi naskah resmi.
// ──────────────────────────────────────────────────────────────────────────

import type { Rapat, Notulensi, ProfilLembaga } from './types'
import { isSupabaseEnabled } from '../lib/supabase'
import { rekapPresensi, rekapVoting, formatTanggal, uid } from './utils'
import { MODA_LABEL, PERAN_LABEL } from './types'

export const aiTersedia = isSupabaseEnabled

const FN_URL = `${(import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? ''}/functions/v1/pleno-ai`
const ANON = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? ''

// ── Notulensi otomatis ───────────────────────────────────────────────────────

/** Ekstraksi kalimat penting dari transkrip secara heuristik (mode lokal). */
function ringkasLokal(rapat: Rapat): Notulensi {
  const segmen = rapat.transkrip
  const poinPembahasan = segmen.map((s) => `${s.pembicara}: ${s.teks}`)

  // Keputusan: dari hasil voting + kalimat yang memuat kata kunci keputusan.
  const keputusan: string[] = []
  for (const v of rapat.voting) {
    if (v.status === 'ditutup') {
      const rk = rekapVoting(v)
      const opsi = v.opsi.find((o) => o.id === rk.menang)
      if (opsi) {
        keputusan.push(`${v.pertanyaan} → diputuskan: "${opsi.teks}" (${rk.hitung[opsi.id]} dari ${rk.total} suara).`)
      } else if (rk.seri) {
        keputusan.push(`${v.pertanyaan} → hasil pemungutan suara imbang, diserahkan kepada pimpinan.`)
      }
    }
  }
  const kataKunci = /(memutuskan|menetapkan|disepakati|menyetujui|keputusan)/i
  for (const s of segmen) {
    if (kataKunci.test(s.teks)) keputusan.push(s.teks)
  }

  const ringkasan =
    segmen.length === 0
      ? 'Belum ada transkrip rapat. Tambahkan catatan/transkrip untuk menghasilkan ringkasan.'
      : `Rapat membahas ${rapat.agenda.length} butir agenda dengan ${segmen.length} catatan pembahasan. ` +
        (keputusan.length ? `Menghasilkan ${keputusan.length} keputusan/poin penting.` : 'Belum ada keputusan formal yang tercatat.')

  return {
    ringkasan,
    poinPembahasan,
    keputusan: [...new Set(keputusan)],
    tindakLanjut: rapat.notulensi?.tindakLanjut ?? [],
    dibuatPada: new Date().toISOString(),
    sumber: 'lokal',
  }
}

/** Susun notulensi. Mencoba AI bila tersedia, jatuh ke lokal bila gagal. */
export async function buatNotulensi(rapat: Rapat): Promise<Notulensi> {
  if (isSupabaseEnabled && rapat.transkrip.length) {
    try {
      const res = await fetch(FN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ANON}`,
          apikey: ANON,
        },
        body: JSON.stringify({
          mode: 'notulensi',
          judul: rapat.judul,
          agenda: rapat.agenda.map((a) => a.judul),
          transkrip: rapat.transkrip.map((s) => ({ pembicara: s.pembicara, teks: s.teks })),
          voting: rapat.voting.map((v) => ({ pertanyaan: v.pertanyaan, hasil: rekapVoting(v) })),
        }),
      })
      if (res.ok) {
        const body = await res.json()
        if (body?.ringkasan) {
          return {
            ringkasan: body.ringkasan,
            poinPembahasan: body.poinPembahasan ?? [],
            keputusan: body.keputusan ?? [],
            tindakLanjut: (body.tindakLanjut ?? []).map((t: any) => ({
              id: uid('tl-'),
              uraian: typeof t === 'string' ? t : t.uraian,
              penanggungJawab: t.penanggungJawab,
              status: 'belum' as const,
            })),
            dibuatPada: new Date().toISOString(),
            sumber: 'ai',
          }
        }
      }
    } catch {
      /* lanjut ke generator lokal */
    }
  }
  return ringkasLokal(rapat)
}

// ── Berita Acara ──────────────────────────────────────────────────────────────

function angkaRomawi(n: number): string {
  const map: [number, string][] = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ]
  let r = ''
  for (const [v, s] of map) while (n >= v) { r += s; n -= v }
  return r
}

/**
 * Susun naskah Berita Acara Pleno (markdown sederhana) dari seluruh data rapat:
 * kop lembaga, agenda, daftar hadir & kuorum, ringkasan, hasil voting, keputusan,
 * tindak lanjut, dan ruang tanda tangan.
 */
export function susunBeritaAcara(rapat: Rapat, profil: ProfilLembaga): string {
  const rk = rekapPresensi(rapat)
  const bulan = new Date(rapat.tanggal + 'T00:00:00').getMonth() + 1
  const tahun = rapat.tanggal.slice(0, 4)
  const nomor =
    rapat.beritaAcara?.nomor ||
    rapat.nomor ||
    `___/PL/${profil.satuanKerja.replace(/\s+/g, '-')}/${angkaRomawi(bulan)}/${tahun}`

  const L: string[] = []
  L.push(`# BERITA ACARA RAPAT PLENO`)
  L.push(`### ${profil.namaLembaga.toUpperCase()} — ${profil.satuanKerja.toUpperCase()}`)
  L.push(`**Nomor:** ${nomor}`)
  L.push('')
  L.push(
    `Pada hari ini, ${formatTanggal(rapat.tanggal)}, pukul ${rapat.waktuMulai} WIB` +
      `${rapat.waktuSelesai ? ` s.d. ${rapat.waktuSelesai} WIB` : ''}, bertempat di ${rapat.lokasi || '-'} ` +
      `(${MODA_LABEL[rapat.moda]}), telah dilaksanakan Rapat Pleno dengan acara **"${rapat.judul}"**.`,
  )
  L.push('')

  // Agenda
  L.push(`## A. AGENDA RAPAT`)
  if (rapat.agenda.length) rapat.agenda.forEach((a, i) => L.push(`${i + 1}. ${a.judul}`))
  else L.push('_Tidak ada agenda tercatat._')
  L.push('')

  // Daftar hadir & kuorum
  L.push(`## B. DAFTAR HADIR DAN KUORUM`)
  L.push(`Jumlah peserta diundang: **${rk.total}** orang. Hadir: **${rk.hadir}**, izin: **${rk.izin}**, tidak hadir: **${rk.tidakHadir}**.`)
  L.push(`Ambang kuorum: ${rk.ambangKuorum} orang. Status kuorum: **${rk.kuorum ? 'TERPENUHI' : 'TIDAK TERPENUHI'}**.`)
  L.push('')
  const hadirList = rapat.peserta.filter((p) => rapat.presensi.find((x) => x.pesertaId === p.id)?.status === 'hadir')
  hadirList.forEach((p, i) => L.push(`${i + 1}. ${p.nama} — ${p.jabatan}`))
  L.push('')

  // Pembahasan / ringkasan
  L.push(`## C. RINGKASAN PEMBAHASAN`)
  L.push(rapat.notulensi?.ringkasan || '_Belum ada ringkasan notulensi. Susun notulensi terlebih dahulu._')
  if (rapat.notulensi?.poinPembahasan?.length) {
    L.push('')
    rapat.notulensi.poinPembahasan.forEach((p) => L.push(`- ${p}`))
  }
  L.push('')

  // Hasil pemungutan suara
  const votingDitutup = rapat.voting.filter((v) => v.status === 'ditutup')
  if (votingDitutup.length) {
    L.push(`## D. HASIL PEMUNGUTAN SUARA`)
    votingDitutup.forEach((v, idx) => {
      const rkv = rekapVoting(v)
      L.push(`**${idx + 1}. ${v.pertanyaan}**`)
      v.opsi.forEach((o) => L.push(`   - ${o.teks}: ${rkv.hitung[o.id]} suara`))
      const menang = v.opsi.find((o) => o.id === rkv.menang)
      L.push(`   - _Keputusan: ${menang ? menang.teks : 'imbang/diserahkan kepada pimpinan'}._`)
    })
    L.push('')
  }

  // Keputusan
  L.push(`## ${votingDitutup.length ? 'E' : 'D'}. KEPUTUSAN PLENO`)
  const keputusan = rapat.notulensi?.keputusan ?? []
  if (keputusan.length) keputusan.forEach((k, i) => L.push(`${i + 1}. ${k}`))
  else L.push('_Belum ada keputusan tercatat._')
  L.push('')

  // Tindak lanjut
  const tl = rapat.notulensi?.tindakLanjut ?? []
  if (tl.length) {
    L.push(`## ${votingDitutup.length ? 'F' : 'E'}. TINDAK LANJUT`)
    tl.forEach((t, i) =>
      L.push(`${i + 1}. ${t.uraian}${t.penanggungJawab ? ` — _PJ: ${t.penanggungJawab}_` : ''}${t.tenggat ? ` (tenggat ${formatTanggal(t.tenggat)})` : ''}`),
    )
    L.push('')
  }

  // Penutup & tanda tangan
  L.push('---')
  L.push(
    `Demikian Berita Acara ini dibuat dengan sebenarnya untuk dipergunakan sebagaimana mestinya, dan ditandatangani oleh:`,
  )
  L.push('')
  const ttd = rapat.peserta.filter((p) => p.peran !== 'peserta')
  ttd.forEach((p, i) => {
    const status = rapat.beritaAcara?.tandaTangan.find((t) => t.pesertaId === p.id)?.ditandatangani
    L.push(`${i + 1}. **${p.nama}** (${PERAN_LABEL[p.peran]} — ${p.jabatan}) ${status ? '✅ tertandatangani' : '⬜ menunggu'}`)
  })

  return L.join('\n')
}
