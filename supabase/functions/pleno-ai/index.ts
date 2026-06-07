// Edge Function: pleno-ai
// Notulensi otomatis untuk Portal Rapat Pleno KPU — memanggil Claude (Anthropic).
//
// Mode:
//   • notulensi — meringkas transkrip + hasil voting menjadi ringkasan,
//                 poin pembahasan, keputusan, dan tindak lanjut (JSON terstruktur).
//
// SECRET yang diperlukan (Supabase Dashboard → Edge Functions → Manage secrets):
//   ANTHROPIC_API_KEY = sk-ant-...
// Selama secret belum diisi, fungsi mengembalikan 503 {error:"not_configured"}
// sehingga frontend otomatis memakai generator notulensi lokal (luring).
//
// Deploy: supabase functions deploy pleno-ai --no-verify-jwt

import Anthropic from 'npm:@anthropic-ai/sdk'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODEL = 'claude-opus-4-8'

interface Segmen {
  pembicara: string
  teks: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json({ error: 'not_configured', message: 'ANTHROPIC_API_KEY belum diset di Supabase.' }, 503)
    }

    const body = await req.json().catch(() => ({}))
    const judul: string = String(body.judul ?? 'Rapat Pleno').slice(0, 300)
    const agenda: string[] = Array.isArray(body.agenda) ? body.agenda.slice(0, 30).map(String) : []
    const transkrip: Segmen[] = Array.isArray(body.transkrip)
      ? body.transkrip.slice(0, 200).map((s: any) => ({
          pembicara: String(s.pembicara ?? 'Peserta').slice(0, 80),
          teks: String(s.teks ?? '').slice(0, 2000),
        }))
      : []
    const voting = Array.isArray(body.voting) ? body.voting.slice(0, 20) : []

    const client = new Anthropic({ apiKey })
    return await handleNotulensi(client, judul, agenda, transkrip, voting)
  } catch (e) {
    return json({ error: 'server_error', message: String(e) }, 500)
  }
})

async function handleNotulensi(
  client: Anthropic,
  judul: string,
  agenda: string[],
  transkrip: Segmen[],
  voting: unknown[],
) {
  const schema = {
    type: 'object',
    additionalProperties: false,
    properties: {
      ringkasan: { type: 'string' },
      poinPembahasan: { type: 'array', items: { type: 'string' } },
      keputusan: { type: 'array', items: { type: 'string' } },
      tindakLanjut: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            uraian: { type: 'string' },
            penanggungJawab: { type: 'string' },
          },
          required: ['uraian'],
        },
      },
    },
    required: ['ringkasan', 'poinPembahasan', 'keputusan', 'tindakLanjut'],
  }

  const konteks =
    `JUDUL RAPAT: ${judul}\n\n` +
    `AGENDA:\n${agenda.map((a, i) => `${i + 1}. ${a}`).join('\n') || '-'}\n\n` +
    `TRANSKRIP:\n${transkrip.map((s) => `${s.pembicara}: ${s.teks}`).join('\n') || '-'}\n\n` +
    `HASIL VOTING:\n${JSON.stringify(voting)}`

  const system =
    `Kamu notulis resmi rapat pleno Komisi Pemilihan Umum (KPU) Indonesia. ` +
    `Susun notulensi formal, akurat, dan ringkas dalam Bahasa Indonesia baku berdasarkan ` +
    `HANYA materi yang diberikan. Jangan mengarang fakta, angka, atau nama.\n\n` +
    `Hasilkan:\n` +
    `- ringkasan: 2–4 kalimat inti jalannya rapat.\n` +
    `- poinPembahasan: butir-butir pembahasan penting.\n` +
    `- keputusan: keputusan resmi pleno (sertakan hasil voting bila ada).\n` +
    `- tindakLanjut: rencana aksi konkret beserta penanggung jawab bila disebutkan.`

  const resp = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    thinking: { type: 'disabled' },
    output_config: { effort: 'low', format: { type: 'json_schema', schema } },
    system,
    messages: [{ role: 'user', content: konteks }],
  })

  let parsed: Record<string, unknown> = {}
  try {
    parsed = JSON.parse(textOf(resp))
  } catch {
    parsed = {}
  }
  return json({
    ringkasan: parsed.ringkasan ?? '',
    poinPembahasan: parsed.poinPembahasan ?? [],
    keputusan: parsed.keputusan ?? [],
    tindakLanjut: parsed.tindakLanjut ?? [],
  })
}

// deno-lint-ignore no-explicit-any
function textOf(resp: any): string {
  return (resp?.content ?? [])
    .filter((b: any) => b.type === 'text')
    .map((b: any) => b.text)
    .join('')
    .trim()
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
