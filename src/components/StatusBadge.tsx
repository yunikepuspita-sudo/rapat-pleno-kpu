import { STATUS_LABEL, type StatusRapat, type StatusBA } from '../pleno/types'

const WARNA: Record<StatusRapat, string> = {
  draft: 'gray',
  terjadwal: 'blue',
  berlangsung: 'amber',
  selesai: 'green',
  diarsipkan: 'purple',
}

/** Lencana status rapat berwarna. */
export default function StatusBadge({ status }: { status: StatusRapat }) {
  return <span className={`badge badge--${WARNA[status]}`}>{STATUS_LABEL[status]}</span>
}

const BA_WARNA: Record<StatusBA, string> = { belum: 'gray', draft: 'amber', review: 'blue', final: 'green' }
const BA_LABEL: Record<StatusBA, string> = { belum: 'Belum Dibuat', draft: 'Draft', review: 'Review', final: 'Final' }

export function BaBadge({ status }: { status: StatusBA }) {
  return <span className={`badge badge--${BA_WARNA[status]}`}>BA: {BA_LABEL[status]}</span>
}
