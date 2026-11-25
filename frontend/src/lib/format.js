export function formatRupiah(value) {
  const num = Number(value || 0)
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date) + ' WIB'
}

export const ORDER_STATUS_META = {
  dijemput: { label: 'Dijemput', tone: 'info' },
  dicuci: { label: 'Dicuci', tone: 'info' },
  disetrika: { label: 'Disetrika', tone: 'warning' },
  siap_diantar: { label: 'Siap Diantar', tone: 'purple' },
  selesai: { label: 'Selesai', tone: 'success' },
}

export const ORDER_TYPE_LABELS = {
  pickup_delivery: 'Antar-Jemput Kurir',
  pickup_only: 'Jemput Kurir (Pick-Up)',
  delivery_only: 'Antar Kurir (Delivery)',
  walk_in: 'Ambil / Antar Sendiri',
}

export const PAYMENT_STATUS_META = {
  lunas: { label: 'Lunas', tone: 'success' },
  dp: { label: 'DP Dibayar', tone: 'warning' },
  belum_lunas: { label: 'Belum Lunas', tone: 'danger' },
}

export const PAYMENT_METHOD_LABELS = {
  qris: 'QRIS Instan',
  transfer: 'Transfer Bank',
  ewallet: 'E-Wallet (GoPay/OVO/DANA)',
  cod: 'Bayar di Tempat (COD)',
  cash: 'Tunai / Cash',
}
