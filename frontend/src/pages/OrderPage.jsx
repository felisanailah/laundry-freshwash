import { useState, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Truck,
  Store,
  Plus,
  Minus,
  Tag,
  CheckCircle2,
  MapPin,
  CreditCard,
  AlertCircle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../lib/api'
import { formatRupiah } from '../lib/format'

const PAYMENT_METHODS = [
  { id: 'qris', label: 'QRIS Instan', desc: 'Scan langsung & otomatis lunas' },
  { id: 'transfer', label: 'Transfer Bank', desc: 'BCA / Mandiri / BRI Virtual Account' },
  { id: 'ewallet', label: 'E-Wallet', desc: 'GoPay / OVO / DANA / ShopeePay' },
  { id: 'cod', label: 'Bayar di Tempat (COD)', desc: 'Bayar saat kurir tiba' },
]

export default function OrderPage() {
  const [searchParams] = useSearchParams()
  const initialServiceId = Number(searchParams.get('serviceId'))

  const [orderType, setOrderType] = useState('pickup_delivery')
  const [paymentScheme, setPaymentScheme] = useState('dp')
  const [customerName, setCustomerName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [pickupSchedule, setPickupSchedule] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('qris')

  const [quantities, setQuantities] = useState({})
  const [promoInput, setPromoInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState(null)
  const [promoError, setPromoError] = useState('')
  const [createdOrder, setCreatedOrder] = useState(null)

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => {
      const { data } = await api.get('/services')
      return data
    },
  })

  const { data: activePromos = [] } = useQuery({
    queryKey: ['active-promos'],
    queryFn: async () => (await api.get('/promos/active')).data,
  })

  useEffect(() => {
    if (initialServiceId && services.length > 0 && Object.keys(quantities).length === 0) {
      const target = services.find((s) => s.id === initialServiceId)
      if (target) {
        setQuantities({ [target.id]: target.unit === 'kg' ? 3 : 1 })
      }
    }
  }, [initialServiceId, services, quantities])

  const updateQty = (svc, delta) => {
    setQuantities((prev) => {
      const step = svc.unit === 'kg' ? 0.5 : 1
      const current = Number(prev[svc.id] || 0)
      const next = Math.max(0, Math.round((current + delta * step) * 10) / 10)
      const copy = { ...prev }
      if (next <= 0) delete copy[svc.id]
      else copy[svc.id] = next
      return copy
    })
  }

  const selectedItems = useMemo(() => {
    return services
      .filter((s) => quantities[s.id] > 0)
      .map((s) => ({
        service: s,
        quantity: quantities[s.id],
        subtotal: Math.round(s.price * quantities[s.id]),
      }))
  }, [services, quantities])

  const subtotal = useMemo(
    () => selectedItems.reduce((acc, item) => acc + item.subtotal, 0),
    [selectedItems]
  )

  const discount = useMemo(() => {
    if (!appliedPromo || subtotal <= 0) return 0
    if (appliedPromo.discount_type === 'percent') {
      return Math.round((subtotal * Number(appliedPromo.discount_value)) / 100)
    }
    return Math.min(subtotal, Number(appliedPromo.discount_value))
  }, [appliedPromo, subtotal])

  const grandTotal = Math.max(0, subtotal - discount)
  const dpAmount = paymentScheme === 'dp' ? Math.round(grandTotal * 0.5) : grandTotal
  const remainingAmount = Math.max(0, grandTotal - dpAmount)

  const handleApplyPromo = async () => {
    setPromoError('')
    if (!promoInput.trim()) return
    try {
      const { data } = await api.get('/promos/validate', {
        params: { code: promoInput.trim().toUpperCase() },
      })
      setAppliedPromo(data)
    } catch (err) {
      setAppliedPromo(null)
      setPromoError(err.response?.data?.message || 'Kode promo tidak valid.')
    }
  }

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        order_type: orderType,
        customer_name: customerName,
        whatsapp,
        pickup_address: orderType !== 'walk_in' ? pickupAddress : 'Ambil / Antar Sendiri ke Outlet',
        pickup_schedule: pickupSchedule || null,
        notes,
        payment_method: paymentMethod,
        payment_status: paymentScheme === 'dp' ? 'dp' : 'lunas',
        dp_amount: paymentScheme === 'dp' ? dpAmount : grandTotal,
        promo_code: appliedPromo?.code || null,
        items: selectedItems.map((i) => ({
          service_id: i.service.id,
          quantity: i.quantity,
        })),
      }
      const { data } = await api.post('/orders', payload)
      return data
    },
    onSuccess: (data) => {
      setCreatedOrder(data)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedItems.length === 0) return
    createOrderMutation.mutate()
  }

  if (createdOrder) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#10B981] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Pesanan Berhasil Dibuat!</h1>
              <p className="text-sm text-slate-500 mt-1">
                Simpan kode invoice berikut untuk melacak status cucian Anda.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200">
              <p className="text-xs font-semibold text-slate-500 uppercase">Kode Invoice</p>
              <p className="text-2xl font-extrabold text-[#0284C7] tracking-wide mt-0.5">
                {createdOrder.invoice_code}
              </p>
              <p className="text-sm font-bold text-slate-900 mt-2">
                Total: {formatRupiah(createdOrder.total)}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to="/"
                className="flex-1 h-11 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold flex items-center justify-center"
              >
                Lacak Status Cucian
              </Link>
              <button
                onClick={() => {
                  setCreatedOrder(null)
                  setQuantities({})
                  setAppliedPromo(null)
                }}
                className="flex-1 h-11 rounded-lg border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Buat Pesanan Baru
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Pemesanan Online</h1>
          <p className="text-sm text-slate-500 mt-1">
            Jadwalkan penjemputan kurir atau antar cucian langsung ke outlet terdekat.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Order Type Toggle */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">1. Pilihan Pick-Up &amp; Delivery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: 'pickup_delivery',
                    title: 'Antar-Jemput Kurir',
                    desc: 'Kurir jemput & antar saat selesai',
                    Icon: Truck,
                  },
                  {
                    key: 'pickup_only',
                    title: 'Pick-Up Kurir Saja',
                    desc: 'Kurir jemput, ambil sendiri di outlet',
                    Icon: Truck,
                  },
                  {
                    key: 'delivery_only',
                    title: 'Delivery Saja',
                    desc: 'Antar ke outlet, kurir antar saat selesai',
                    Icon: Truck,
                  },
                  {
                    key: 'walk_in',
                    title: 'Ambil / Antar Sendiri',
                    desc: 'Drop-off & ambil langsung di outlet',
                    Icon: Store,
                  },
                ].map(({ key, title, desc, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOrderType(key)}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                      orderType === key
                        ? 'border-[#0284C7] bg-sky-50/70 ring-2 ring-sky-500/15'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        orderType === key
                          ? 'bg-[#0284C7] text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{title}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Pickup & Customer Details */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">2. Detail Pelanggan &amp; Jadwal</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Ibu Sarah A."
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Nomor WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="081234567890"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {orderType !== 'walk_in' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-700">
                      Alamat Penjemputan Lengkap
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setPickupAddress('Jl. Senopati No. 45, Kebayoran Baru, Jakarta Selatan')
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Gunakan Lokasi Saat Ini
                    </button>
                  </div>
                  <textarea
                    required
                    rows={2}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Nama jalan, nomor rumah, patokan..."
                    className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jadwal Jemput / Drop-off
                </label>
                <input
                  type="datetime-local"
                  value={pickupSchedule}
                  onChange={(e) => setPickupSchedule(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* 3. Service Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="text-base font-bold text-slate-900">3. Pilih Layanan &amp; Estimasi</h2>
              <div className="divide-y divide-slate-100">
                {services.map((svc) => {
                  const qty = quantities[svc.id] || 0
                  return (
                    <div key={svc.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-900">{svc.name}</p>
                        <p className="text-xs text-slate-500">
                          {formatRupiah(svc.price)} / {svc.unit} • Estimasi {svc.estimated_hours} jam
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQty(svc, -1)}
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-14 text-center text-sm font-bold text-slate-900">
                          {qty} {svc.unit}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQty(svc, 1)}
                          className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center hover:bg-[#0369A1]"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Catatan Khusus (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pisahkan pakaian putih, alergi pewangi tajam"
                  className="w-full h-11 px-3.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Ringkasan Pesanan</h2>

            {selectedItems.length === 0 ? (
              <p className="text-sm text-slate-500 py-4 border-y border-slate-100">
                Belum ada layanan dipilih. Silakan tambahkan layanan di sebelah kiri.
              </p>
            ) : (
              <div className="space-y-2.5 py-3 border-y border-slate-100">
                {selectedItems.map(({ service, quantity, subtotal: itemSub }) => (
                  <div key={service.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">
                      {service.name}{' '}
                      <span className="text-slate-400">
                        ({quantity} {service.unit})
                      </span>
                    </span>
                    <span className="font-semibold text-slate-900">{formatRupiah(itemSub)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Promo Code */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kode Promo / Voucher Diskon
                </label>
                {activePromos.length > 0 && (
                  <span className="text-[11px] text-[#0284C7] font-semibold">
                    {activePromos.length} voucher aktif
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  placeholder="Masukkan kode promo (contoh: HEMAT20)"
                  className="flex-1 h-10 px-3 rounded-lg border border-slate-200 text-sm font-mono font-bold uppercase focus:outline-none focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  className="px-4 h-10 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-xs font-bold text-white transition"
                >
                  Pakai
                </button>
              </div>

              {/* Rekomendasi Promo Aktif dari Owner */}
              {activePromos.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <p className="text-[11px] text-slate-500 font-medium">Klik voucher untuk langsung gunakan:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {activePromos.map((p) => {
                      const isSelected = appliedPromo?.code === p.code
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            setPromoInput(p.code)
                            setAppliedPromo(p)
                            setPromoError('')
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-sky-50 text-[#0284C7] border-sky-200 hover:bg-sky-100'
                          }`}
                        >
                          <Tag className="w-3 h-3" />
                          <span className="font-mono">{p.code}</span>
                          <span className="text-[10px] opacity-80">
                            ({p.discount_type === 'percent' ? `${p.discount_value}%` : formatRupiah(p.discount_value)})
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {appliedPromo && (
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Kupon <strong>{appliedPromo.code}</strong> aktif: Diskon{' '}
                    {appliedPromo.discount_type === 'percent'
                      ? `${appliedPromo.discount_value}%`
                      : formatRupiah(appliedPromo.discount_value)}
                  </span>
                </div>
              )}
              {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
            </div>

            {/* Totals & DP Scheme */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon Promo</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Tagihan</span>
                <span>{formatRupiah(grandTotal)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPaymentScheme('dp')}
                  className={`p-2.5 rounded-xl border text-left text-xs ${
                    paymentScheme === 'dp'
                      ? 'border-[#0284C7] bg-sky-50 text-[#0284C7] font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Bayar DP 50% Dulu
                  <span className="block text-[11px] font-normal text-slate-500">
                    Pelunasan saat selesai
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentScheme('lunas')}
                  className={`p-2.5 rounded-xl border text-left text-xs ${
                    paymentScheme === 'lunas'
                      ? 'border-[#10B981] bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Bayar Lunas Langsung
                  <span className="block text-[11px] font-normal text-slate-500">
                    100% di awal
                  </span>
                </button>
              </div>

              <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-100 space-y-1">
                <div className="flex justify-between text-sm font-extrabold text-[#0284C7]">
                  <span>{paymentScheme === 'dp' ? 'Bayar DP Sekarang (50%)' : 'Bayar Sekarang'}</span>
                  <span>{formatRupiah(dpAmount)}</span>
                </div>
                {paymentScheme === 'dp' && (
                  <div className="flex justify-between text-xs font-semibold text-amber-700">
                    <span>Sisa Pelunasan (Saat Selesai)</span>
                    <span>{formatRupiah(remainingAmount)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <CreditCard className="w-3.5 h-3.5" /> Metode Pembayaran
              </label>
              <div className="grid grid-cols-1 gap-2">
                {PAYMENT_METHODS.map((pm) => (
                  <label
                    key={pm.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      paymentMethod === pm.id
                        ? 'border-[#0284C7] bg-sky-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">{pm.label}</p>
                      <p className="text-[11px] text-slate-500">{pm.desc}</p>
                    </div>
                    <input
                      type="radio"
                      name="payment_method"
                      checked={paymentMethod === pm.id}
                      onChange={() => setPaymentMethod(pm.id)}
                      className="accent-[#0284C7]"
                    />
                  </label>
                ))}
              </div>
            </div>

            {createOrderMutation.isError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                Gagal membuat pesanan. Pastikan semua data terisi benar.
              </div>
            )}

            <button
              type="submit"
              disabled={selectedItems.length === 0 || createOrderMutation.isPending}
              className="w-full h-12 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {createOrderMutation.isPending
                ? 'Memproses Pesanan...'
                : 'Konfirmasi & Buat Pesanan'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
