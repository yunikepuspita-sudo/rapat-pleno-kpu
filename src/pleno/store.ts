// ──────────────────────────────────────────────────────────────────────────
// Store data Portal Rapat Pleno.
//
// Penyimpanan lokal (localStorage) dengan pola publish/subscribe sederhana +
// hook React `usePleno()`. Tidak ada dependensi state-management eksternal.
// Semua mutasi melalui aksi-aksi di bawah agar konsisten & langsung tersimpan.
// ──────────────────────────────────────────────────────────────────────────

import { useSyncExternalStore } from 'react'
import type {
  Rapat,
  Peserta,
  Bahan,
  ButirAgenda,
  Voting,
  SegmenTranskrip,
  Notulensi,
  BeritaAcara,
  TindakLanjut,
  StatusRapat,
  StatusHadir,
  ProfilLembaga,
} from './types'
import { uid } from './utils'
import { seedRapat, profilDefault } from './seed'

const KEY_RAPAT = 'pleno.rapat.v1'
const KEY_PROFIL = 'pleno.profil.v1'
const KEY_USER = 'pleno.user.v1'

interface State {
  rapat: Rapat[]
  profil: ProfilLembaga
  /** id peserta yang sedang "login" pada perangkat ini (untuk voting/ttd). */
  userId: string | null
}

// ── Persistensi ─────────────────────────────────────────────────────────────

function load(): State {
  let rapat: Rapat[]
  let profil: ProfilLembaga
  try {
    const raw = localStorage.getItem(KEY_RAPAT)
    rapat = raw ? (JSON.parse(raw) as Rapat[]) : seedRapat()
  } catch {
    rapat = seedRapat()
  }
  try {
    const raw = localStorage.getItem(KEY_PROFIL)
    profil = raw ? (JSON.parse(raw) as ProfilLembaga) : profilDefault()
  } catch {
    profil = profilDefault()
  }
  const userId = localStorage.getItem(KEY_USER) || null
  return { rapat, profil, userId }
}

let state: State = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY_RAPAT, JSON.stringify(state.rapat))
    localStorage.setItem(KEY_PROFIL, JSON.stringify(state.profil))
    if (state.userId) localStorage.setItem(KEY_USER, state.userId)
    else localStorage.removeItem(KEY_USER)
  } catch {
    /* kuota penuh / mode privat — abaikan */
  }
}

function emit() {
  persist()
  listeners.forEach((l) => l())
}

function setState(next: Partial<State>) {
  state = { ...state, ...next }
  emit()
}

/** Perbarui satu rapat berdasarkan id (immutable). */
function patchRapat(id: string, fn: (r: Rapat) => Rapat) {
  setState({
    rapat: state.rapat.map((r) =>
      r.id === id ? { ...fn(r), diperbaruiPada: new Date().toISOString() } : r,
    ),
  })
}

// ── Hook React ───────────────────────────────────────────────────────────────

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}
function getSnapshot() {
  return state
}

export function usePleno() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export function getRapat(id: string | undefined): Rapat | undefined {
  return state.rapat.find((r) => r.id === id)
}

// ── Aksi: Rapat ───────────────────────────────────────────────────────────────

export const aksi = {
  // — Profil & user —
  setProfil(profil: ProfilLembaga) {
    setState({ profil })
  },
  setUser(userId: string | null) {
    setState({ userId })
  },

  // — Rapat (Persiapan) —
  buatRapat(data: Partial<Rapat>): Rapat {
    const now = new Date().toISOString()
    const rapat: Rapat = {
      id: uid('r-'),
      nomor: data.nomor || '',
      judul: data.judul || 'Rapat Pleno Tanpa Judul',
      tanggal: data.tanggal || now.slice(0, 10),
      waktuMulai: data.waktuMulai || '09:00',
      waktuSelesai: data.waktuSelesai,
      lokasi: data.lokasi || '',
      moda: data.moda || 'hybrid',
      tautanRapat: data.tautanRapat,
      status: data.status || 'draft',
      agenda: data.agenda || [],
      peserta: data.peserta || [],
      bahan: data.bahan || [],
      presensi: [],
      voting: [],
      transkrip: [],
      dibuatPada: now,
      diperbaruiPada: now,
    }
    setState({ rapat: [rapat, ...state.rapat] })
    return rapat
  },
  perbaruiRapat(id: string, data: Partial<Rapat>) {
    patchRapat(id, (r) => ({ ...r, ...data }))
  },
  hapusRapat(id: string) {
    setState({ rapat: state.rapat.filter((r) => r.id !== id) })
  },
  setStatus(id: string, status: StatusRapat) {
    patchRapat(id, (r) => ({ ...r, status }))
  },

  // — Agenda —
  tambahAgenda(id: string, judul: string, keterangan?: string) {
    patchRapat(id, (r) => ({
      ...r,
      agenda: [...r.agenda, { id: uid('a-'), judul, keterangan }],
    }))
  },
  hapusAgenda(id: string, agendaId: string) {
    patchRapat(id, (r) => ({ ...r, agenda: r.agenda.filter((a) => a.id !== agendaId) }))
  },
  setAgenda(id: string, agenda: ButirAgenda[]) {
    patchRapat(id, (r) => ({ ...r, agenda }))
  },

  // — Peserta —
  tambahPeserta(id: string, p: Omit<Peserta, 'id'>) {
    patchRapat(id, (r) => ({ ...r, peserta: [...r.peserta, { ...p, id: uid('p-') }] }))
  },
  perbaruiPeserta(id: string, pesertaId: string, data: Partial<Peserta>) {
    patchRapat(id, (r) => ({
      ...r,
      peserta: r.peserta.map((p) => (p.id === pesertaId ? { ...p, ...data } : p)),
    }))
  },
  hapusPeserta(id: string, pesertaId: string) {
    patchRapat(id, (r) => ({
      ...r,
      peserta: r.peserta.filter((p) => p.id !== pesertaId),
      presensi: r.presensi.filter((p) => p.pesertaId !== pesertaId),
    }))
  },

  // — Bahan —
  tambahBahan(id: string, b: Omit<Bahan, 'id'>) {
    patchRapat(id, (r) => ({ ...r, bahan: [...r.bahan, { ...b, id: uid('b-') }] }))
  },
  hapusBahan(id: string, bahanId: string) {
    patchRapat(id, (r) => ({ ...r, bahan: r.bahan.filter((b) => b.id !== bahanId) }))
  },

  // — Presensi —
  setPresensi(
    id: string,
    pesertaId: string,
    status: StatusHadir,
    metode: 'qr' | 'manual' = 'manual',
  ) {
    patchRapat(id, (r) => {
      const ada = r.presensi.some((p) => p.pesertaId === pesertaId)
      const entri = {
        pesertaId,
        status,
        metode,
        waktu: status === 'hadir' ? new Date().toISOString() : undefined,
      }
      return {
        ...r,
        presensi: ada
          ? r.presensi.map((p) => (p.pesertaId === pesertaId ? entri : p))
          : [...r.presensi, entri],
      }
    })
  },

  // — Voting —
  buatVoting(id: string, pertanyaan: string, opsiTeks: string[], rahasia: boolean): Voting {
    const v: Voting = {
      id: uid('v-'),
      pertanyaan,
      opsi: opsiTeks.filter((t) => t.trim()).map((t) => ({ id: uid('o-'), teks: t.trim() })),
      status: 'draft',
      rahasia,
      suara: {},
    }
    patchRapat(id, (r) => ({ ...r, voting: [...r.voting, v] }))
    return v
  },
  bukaVoting(id: string, votingId: string) {
    patchRapat(id, (r) => ({
      ...r,
      voting: r.voting.map((v) =>
        v.id === votingId ? { ...v, status: 'dibuka', dibukaPada: new Date().toISOString() } : v,
      ),
    }))
  },
  tutupVoting(id: string, votingId: string) {
    patchRapat(id, (r) => ({
      ...r,
      voting: r.voting.map((v) =>
        v.id === votingId ? { ...v, status: 'ditutup', ditutupPada: new Date().toISOString() } : v,
      ),
    }))
  },
  beriSuara(id: string, votingId: string, pesertaId: string, opsiId: string) {
    patchRapat(id, (r) => ({
      ...r,
      voting: r.voting.map((v) =>
        v.id === votingId && v.status === 'dibuka'
          ? { ...v, suara: { ...v.suara, [pesertaId]: opsiId } }
          : v,
      ),
    }))
  },
  hapusVoting(id: string, votingId: string) {
    patchRapat(id, (r) => ({ ...r, voting: r.voting.filter((v) => v.id !== votingId) }))
  },

  // — Transkrip / Notulensi —
  setTranskrip(id: string, transkrip: SegmenTranskrip[]) {
    patchRapat(id, (r) => ({ ...r, transkrip }))
  },
  tambahSegmen(id: string, pembicara: string, teks: string, waktu?: string) {
    patchRapat(id, (r) => ({
      ...r,
      transkrip: [...r.transkrip, { id: uid('s-'), pembicara, teks, waktu }],
    }))
  },
  setNotulensi(id: string, notulensi: Notulensi) {
    patchRapat(id, (r) => ({ ...r, notulensi }))
  },
  setTindakLanjut(id: string, tindakLanjut: TindakLanjut[]) {
    patchRapat(id, (r) =>
      r.notulensi ? { ...r, notulensi: { ...r.notulensi, tindakLanjut } } : r,
    )
  },

  // — Berita Acara —
  setBeritaAcara(id: string, ba: BeritaAcara) {
    patchRapat(id, (r) => ({ ...r, beritaAcara: ba }))
  },
  tandaTangani(id: string, pesertaId: string) {
    patchRapat(id, (r) => {
      if (!r.beritaAcara) return r
      return {
        ...r,
        beritaAcara: {
          ...r.beritaAcara,
          tandaTangan: r.beritaAcara.tandaTangan.map((t) =>
            t.pesertaId === pesertaId
              ? { ...t, ditandatangani: true, waktu: new Date().toISOString() }
              : t,
          ),
        },
      }
    })
  },

  // — Demo —
  resetDemo() {
    setState({ rapat: seedRapat(), profil: profilDefault() })
  },
  kosongkan() {
    setState({ rapat: [] })
  },
}
