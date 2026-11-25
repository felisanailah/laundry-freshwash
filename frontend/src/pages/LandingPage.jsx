import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Truck,
  ShieldCheck,
  Sparkles,
  Search,
  Clock,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import OrderStepper from '../components/OrderStepper'
import StatusPill from '../components/StatusPill'
import api from '../lib/api'
import { formatRupiah, formatDateTime, ORDER_STATUS_META, ORDER_TYPE_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_META } from '../lib/format'

export default function LandingPage() {
  const [invoiceInput, setInvoiceInput] = useState('LND-20261125-001')
  const [trackedCode, setTrackedCode] = useState('LND-20261125-001')

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services')
      return data
    },
  })

  const {
    data: trackedOrder,
    isLoading: loadingTrack,
    isError: trackError,
  } = useQuery({
    queryKey: ['track-order', trackedCode],
    queryFn: async () => {
      const { data } = await api.get(`/orders/track/${encodeURIComponent(trackedCode)}`)
      return data
    },
    enabled: Boolean(trackedCode),
    retry: false,
  })

  const handleTrackSubmit = (e) => {
    e.preventDefault()
    if (!invoiceInput.trim()) return
    setTrackedCode(invoiceInput.trim().toUpperCase())
    document.getElementById('lacak')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      {/* Hero + Quick Tracker */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-sky-50/40 to-[#F8FAFC] border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping" />
              Layanan Laundry Cepat &amp; Higienis #1
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-bold text-slate-900 tracking-tight leading-tight">
              Cucian Bersih, Wangi &amp; Rapi{' '}
              <span className="text-[#0284C7]">Tanpa Ribet</span> Langsung Dari Rumah.
            </h1>

            <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
              Nikmati kemudahan layanan antar-jemput cucian harian maupun premium. Kami menggunakan
              deterjen ramah lingkungan, sterilisasi uap murni, dan sistem{' '}
              <strong className="text-slate-800">1 mesin eksklusif untuk 1 pelanggan</strong>.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                to="/order"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold shadow-sm transition-all active:scale-[0.98]"
              >
                <Truck className="w-4 h-4" />
                Pesan Antar-Jemput
              </Link>
              <a
                href="#layanan"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-[#0284C7] hover:text-[#0284C7] text-slate-800 text-sm font-semibold transition-colors"
              >
                Lihat Daftar Layanan
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-sky-50 text-[#0284C7] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Gratis Ongkir</p>
                  <p className="text-xs text-slate-500">Radius 5 km jemput</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#10B981] flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Garansi Cuci Ulang</p>
                  <p className="text-xs text-slate-500">Jika noda belum hilang</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">1 Mesin 1 Klien</p>
                  <p className="text-xs text-slate-500">Higienis &amp; steril</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Quick Tracker Card */}
          <div className="lg:col-span-5">
            <div className="relative bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-[0_20px_40px_-12px_rgba(2,132,199,0.12)]">
              <span className="absolute -top-3 right-6 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold tracking-wide">
                LIVE TRACKING 24/7
              </span>
              <h2 className="text-lg font-bold text-slate-900">Lacak Status Cucian</h2>
              <p className="text-xs text-slate-500 mt-1 mb-5">
                Masukkan kode invoice dari struk kasir atau notifikasi WhatsApp Anda.
              </p>

              <form onSubmit={handleTrackSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor Nota Invoice
                  </label>
                  <input
                    type="text"
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    placeholder="Contoh: LND-20261125-001"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#0284C7] focus:ring-2 focus:ring-sky-500/15"
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {['LND-20261125-001', 'LND-20261125-002', 'LND-20261125-003'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => {
                          setInvoiceInput(code)
                          setTrackedCode(code)
                        }}
                        className="px-2 py-0.5 rounded bg-slate-100 hover:bg-sky-50 text-[11px] font-semibold text-slate-600 hover:text-[#0284C7]"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full h-11 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Lacak Pesanan Saya
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Live Tracking Result */}
      <section id="lacak" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {loadingTrack ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Memuat status cucian...
          </div>
        ) : trackError || !trackedOrder ? (
          <div className="bg-white rounded-2xl border border-red-200 p-6 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <p className="text-sm font-bold">Invoice "{trackedCode}" tidak ditemukan.</p>
              <p className="text-xs text-red-600">
                Pastikan format kode invoice benar, misalnya LND-20261125-001.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 bg-slate-50/80 border-b border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Invoice
                  </span>
                  <h3 className="text-xl font-bold text-slate-900">{trackedOrder.invoice_code}</h3>
                  <StatusPill
                    tone={PAYMENT_STATUS_META[trackedOrder.payment?.status]?.tone || 'neutral'}
                    dot
                  >
                    {PAYMENT_STATUS_META[trackedOrder.payment?.status]?.label || 'Belum Lunas'} (
                    {PAYMENT_METHOD_LABELS[trackedOrder.payment?.method] || trackedOrder.payment?.method})
                  </StatusPill>
                  <StatusPill tone={ORDER_STATUS_META[trackedOrder.status]?.tone || 'info'}>
                    {ORDER_STATUS_META[trackedOrder.status]?.label || trackedOrder.status}
                  </StatusPill>
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  Pelanggan: <strong className="text-slate-700">{trackedOrder.customer?.name}</strong>{' '}
                  • Layanan: <strong className="text-slate-700">{ORDER_TYPE_LABELS[trackedOrder.order_type] || trackedOrder.order_type}</strong>{' '}
                  • Masuk: {formatDateTime(trackedOrder.created_at)} • Cabang:{' '}
                  <span className="text-[#0284C7] font-semibold">
                    {trackedOrder.branch?.name || 'Pusat'}
                  </span>
                </p>
              </div>
              <a
                href="https://wa.me/6281234567890"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold hover:bg-emerald-100 self-start md:self-auto"
              >
                <PhoneCall className="w-4 h-4" />
                Hubungi CS WhatsApp
              </a>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <OrderStepper currentStatus={trackedOrder.status} />

              <div className="pt-5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {trackedOrder.items?.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                      {item.service?.name} — {Number(item.quantity)} {item.service?.unit}
                    </span>
                  ))}
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-500">Total Tagihan</p>
                  <p className="text-xl font-bold text-slate-900">
                    {formatRupiah(trackedOrder.total)}
                  </p>
                  {trackedOrder.payment?.status === 'dp' && (
                    <p className="text-xs font-semibold text-amber-700 mt-0.5">
                      DP Masuk: {formatRupiah(trackedOrder.payment?.paid_amount)} • Sisa Pelunasan:{' '}
                      {formatRupiah(trackedOrder.payment?.remaining_amount)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Service Catalog Grid */}
      <section id="layanan" className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0284C7]">
              Katalog Layanan
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Pilihan Perawatan Pakaian &amp; Sepatu
            </h2>
          </div>
          <Link
            to="/order"
            className="text-sm font-semibold text-[#0284C7] hover:underline inline-flex items-center gap-1"
          >
            Pesan Sekarang <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingServices ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((svc) => (
              <div
                key={svc.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col justify-between hover:border-[#0284C7]/50 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-full bg-sky-50 text-[#0284C7] text-[11px] font-bold uppercase">
                      {svc.category.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                      <Clock className="w-3.5 h-3.5" />
                      {svc.estimated_hours} Jam
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{svc.name}</h3>
                  <p className="text-lg font-extrabold text-[#0284C7] mt-2">
                    {formatRupiah(svc.price)}{' '}
                    <span className="text-xs font-medium text-slate-500">/ {svc.unit}</span>
                  </p>
                </div>

                <Link
                  to={`/order?serviceId=${svc.id}`}
                  className="mt-5 w-full h-10 rounded-lg border border-slate-200 hover:border-[#0284C7] hover:bg-sky-50 text-slate-800 hover:text-[#0284C7] text-xs font-semibold flex items-center justify-center transition-colors"
                >
                  Pilih Layanan
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
