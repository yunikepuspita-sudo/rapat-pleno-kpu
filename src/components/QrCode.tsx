import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

/**
 * Render QR code dari teks/URL menggunakan paket `qrcode` (luring).
 * Bila gagal, jatuh ke layanan gambar daring sebagai cadangan.
 */
export default function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>('')
  const [gagal, setGagal] = useState(false)

  useEffect(() => {
    let aktif = true
    QRCode.toDataURL(value, { width: size, margin: 1, errorCorrectionLevel: 'M' })
      .then((url) => aktif && setSrc(url))
      .catch(() => aktif && setGagal(true))
    return () => {
      aktif = false
    }
  }, [value, size])

  if (gagal) {
    return (
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`}
        alt="QR Code"
        width={size}
        height={size}
      />
    )
  }
  return src ? <img src={src} alt="QR Code" width={size} height={size} /> : <div style={{ width: size, height: size }} />
}
