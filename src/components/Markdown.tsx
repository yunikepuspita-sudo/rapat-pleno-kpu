// Renderer markdown minimal untuk naskah Berita Acara (heading, list, bold, hr).
// Konten dihasilkan oleh aplikasi sendiri; tetap meng-escape HTML demi aman.

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function inline(s: string): string {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
}

export default function Markdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const html: string[] = []
  let list: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (list) { html.push(`</${list}>`); list = null }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (/^### /.test(line)) { closeList(); html.push(`<h3>${inline(line.slice(4))}</h3>`); continue }
    if (/^## /.test(line)) { closeList(); html.push(`<h2>${inline(line.slice(3))}</h2>`); continue }
    if (/^# /.test(line)) { closeList(); html.push(`<h1>${inline(line.slice(2))}</h1>`); continue }
    if (/^---+$/.test(line)) { closeList(); html.push('<hr/>'); continue }
    const ol = line.match(/^(\d+)\.\s+(.*)/)
    if (ol) { if (list !== 'ol') { closeList(); html.push('<ol>'); list = 'ol' } html.push(`<li>${inline(ol[2])}</li>`); continue }
    const ul = line.match(/^[-•]\s+(.*)/)
    if (ul) { if (list !== 'ul') { closeList(); html.push('<ul>'); list = 'ul' } html.push(`<li>${inline(ul[1])}</li>`); continue }
    if (line === '') { closeList(); continue }
    closeList()
    html.push(`<p>${inline(line)}</p>`)
  }
  closeList()

  return <div className="naskah" dangerouslySetInnerHTML={{ __html: html.join('\n') }} />
}
