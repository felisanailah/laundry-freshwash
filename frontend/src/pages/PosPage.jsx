import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Plus,
  Trash2,
  UserPlus,
  Printer,
  MessageCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import api from '../lib/api'
import { formatRupiah } from '../lib/format'

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'kiloan', label: 'Kiloan' },
  { key: 'satuan', label: 'Satuan' },
  { key: 'ekspres', label: 'Ekspres' },
  { key: 'sepatu_tas', label: 'Sepatu & Tas' },
]

export default function PosPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [orderType, setOrderType] = useState('walk_in')
  const [customerId, setCustomerId] = useState('')
  const [courierId, setCourierId] = useState('')
  const [cart, setCart] = useState([])
  const [promoCode, setPromoCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [notes, setNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('dp')
  const [dpAmount, setDpAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [lastSavedOrder, setLastSavedOrder] = useState(null)

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustWa, setNewCustWa] = useState('')

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: async () => (await api.get('/services')).data,
  })

  const { data: customers = [] } = useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => (await api.get('/admin/customers')).data,
  })

  const { data: couriers = [] } = useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => (await api.get('/admin/couriers')).data,
  })

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = category === 'all' || s.category === category
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [services, category, search])

  const addToCart = (svc) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.service.id === svc.id)
      if (existing) {
        return prev.map((item) =>
          item.service.id === svc.id
            ? { ...item, quantity: Math.round((Number(item.quantity) + 1) * 10) / 10 }
            : item
        )
      }
      return [...prev, { service: svc, quantity: svc.unit === 'kg' ? 1.0 : 1 }]
    })
  }

  const updateCartQty = (serviceId, val) => {
    const qty = parseFloat(val)
    setCart((prev) =>
      prev.map((item) =>
        item.service.id === serviceId ? { ...item, quantity: Number.isNaN(qty) ? 0 : qty } : item
      )
    )
  }

  const removeFromCart = (serviceId) => {
    setCart((prev) => prev.filter((item) => item.service.id !== serviceId))
  }

  const subtotal = useMemo(
    () =>
      cart.reduce((acc, item) => acc + Math.round(Number(item.service.price) * Number(item.quantity || 0)), 0),
    [cart]
  )
  const discount = Math.round((subtotal * discountPercent) / 100)
  const grandTotal = Math.max(0, subtotal - discount)

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    try {
      const { data } = await api.get('/promos/validate', {
        params: { code: promoCode.trim().toUpperCase() },
      })
      if (data.discount_type === 'percent') {
        setDiscountPercent(Number(data.discount_value))
      }
    } catch {
      setDiscountPercent(0)
    }
  }

  const createCustomerMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/customers', { name: newCustName, whatsapp: newCustWa })).data,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
      setCustomerId(String(created.id))
      setNewCustName('')
      setNewCustWa('')
      setShowNewCustomer(false)
    },
  })

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        customer_id: Number(customerId),
        courier_id: orderType !== 'walk_in' && courierId ? Number(courierId) : null,
        order_type: orderType,
        notes,
        promo_code: promoCode.trim() ? promoCode.trim().toUpperCase() : null,
        payment_status: paymentStatus,
        dp_amount: paymentStatus === 'dp' ? Number(dpAmount || Math.round(grandTotal * 0.5)) : null,
        payment_method: paymentMethod,
        items: cart
          .filter((c) => Number(c.quantity) > 0)
          .map((c) => ({ service_id: c.service.id, quantity: Number(c.quantity) })),
      }
      return (await api.post('/admin/pos/orders', payload)).data
    },
    onSuccess: (data) => {
      setLastSavedOrder(data)
      setCart([])
      setNotes('')
      setPromoCode('')
      setDiscountPercent(0)
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <div className="flex-1 flex flex-col lg:flex-row min-w-0">
        {/* Left 60%: Service Catalog */}
        <div className="lg:w-3/5 p-4 sm:p-6 space-y-5 overflow-y-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kasir / Point of Sale</h1>
              <p className="text-xs text-slate-500">Pilih layanan untuk ditambahkan ke transaksi</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari layanan..."
                className="w-full h-10 pl-9 pr-3 rounded-lg bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  category === cat.key
                    ? 'bg-[#0284C7] text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
            {filteredServices.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => addToCart(svc)}
                className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-[#0284C7] hover:shadow-sm transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-full">
                      {svc.category.replace('_', ' ')}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                      <Clock className="w-3 h-3" /> {svc.estimated_hours}j
                    </span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{svc.name}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm font-extrabold text-slate-900">
                    {formatRupiah(svc.price)}
                    <span className="text-xs font-normal text-slate-500">/{svc.unit}</span>
                  </p>
                  <span className="w-7 h-7 rounded-lg bg-sky-50 text-[#0284C7] group-hover:bg-[#0284C7] group-hover:text-white flex items-center justify-center transition-colors">
                    <Plus className="w-4 h-4" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right 40%: Active Order Cart */}
        <div className="lg:w-2/5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 sm:p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">Transaksi Baru</h2>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="h-9 px-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700"
              >
                <option value="walk_in">Walk-In (Ambil Sendiri)</option>
                <option value="pickup_delivery">Antar-Jemput Kurir</option>
                <option value="pickup_only">Pick-Up Kurir Saja</option>
                <option value="delivery_only">Delivery Kurir Saja</option>
              </select>
            </div>

            {lastSavedOrder && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>
                    Tersimpan: <strong>{lastSavedOrder.invoice_code}</strong>
                  </span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="underline font-bold"
                >
                  Cetak
                </button>
              </div>
            )}

            {/* Customer Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Pelanggan</label>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#0284C7] hover:underline"
                >
                  <UserPlus className="w-3.5 h-3.5" /> + Pelanggan Baru
                </button>
              </div>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white focus:outline-none focus:border-[#0284C7]"
              >
                <option value="">-- Pilih Pelanggan --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.whatsapp})
                  </option>
                ))}
              </select>

              {orderType !== 'walk_in' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tugaskan Kurir
                  </label>
                  <select
                    value={courierId}
                    onChange={(e) => setCourierId(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#0284C7]"
                  >
                    <option value="">-- Pilih Kurir (Opsional) --</option>
                    {couriers.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name} ({k.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {showNewCustomer && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                  <input
                    type="text"
                    placeholder="Nama Pelanggan"
                    value={newCustName}
                    onChange={(e) => setNewCustName(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <input
                    type="text"
                    placeholder="No. WhatsApp (08...)"
                    value={newCustWa}
                    onChange={(e) => setNewCustWa(e.target.value)}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => createCustomerMutation.mutate()}
                    disabled={!newCustName || !newCustWa}
                    className="w-full h-8 rounded-lg bg-[#0284C7] text-white text-xs font-semibold disabled:opacity-50"
                  >
                    Simpan Pelanggan
                  </button>
                </div>
              )}
            </div>

            {/* Cart Items */}
            <div className="border-y border-slate-100 py-3 space-y-2.5 max-h-56 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Klik layanan di sebelah kiri untuk menambahkan ke nota.
                </p>
              ) : (
                cart.map(({ service, quantity }) => (
                  <div key={service.id} className="flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 truncate">{service.name}</p>
                      <p className="text-xs text-slate-500">
                        {formatRupiah(service.price)}/{service.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step={service.unit === 'kg' ? '0.1' : '1'}
                        min="0.1"
                        value={quantity}
                        onChange={(e) => updateCartQty(service.id, e.target.value)}
                        className="w-16 h-8 px-2 rounded-lg border border-slate-200 text-xs font-bold text-center"
                      />
                      <span className="text-xs text-slate-500 w-7">{service.unit}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(service.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Promo & Notes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo (HEMAT20)"
                  className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs uppercase"
                />
                <button
                  type="button"
                  onClick={applyPromo}
                  className="px-2.5 h-9 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-50"
                >
                  OK
                </button>
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan nota..."
                className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs"
              />
            </div>
          </div>

          {/* Payment & Action */}
          <div className="space-y-3 pt-3 border-t border-slate-200">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon ({discountPercent}%)</span>
                  <span>-{formatRupiah(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1">
                <span>Grand Total</span>
                <span className="text-[#0284C7]">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
              >
                <option value="dp">Bayar DP Dulu (50% / Custom)</option>
                <option value="lunas">Bayar Lunas Langsung</option>
                <option value="belum_lunas">Bayar Nanti (Belum Lunas)</option>
              </select>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold"
              >
                <option value="cash">Tunai / Cash</option>
                <option value="qris">QRIS</option>
                <option value="transfer">Transfer Bank</option>
              </select>
            </div>

            {paymentStatus === 'dp' && (
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-[11px] font-bold text-amber-800">Nominal DP (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    max={grandTotal}
                    placeholder={String(Math.round(grandTotal * 0.5))}
                    value={dpAmount}
                    onChange={(e) => setDpAmount(e.target.value)}
                    className="w-32 h-8 px-2 rounded-lg border border-amber-300 bg-white text-xs font-bold text-right"
                  />
                </div>
                <p className="text-[11px] text-amber-700 text-right">
                  Sisa pelunasan saat selesai:{' '}
                  <strong>
                    {formatRupiah(
                      Math.max(0, grandTotal - Number(dpAmount || Math.round(grandTotal * 0.5)))
                    )}
                  </strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={!customerId || cart.length === 0 || saveOrderMutation.isPending}
                onClick={() => saveOrderMutation.mutate()}
                className="h-10 rounded-lg bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Printer className="w-4 h-4" />
                Simpan &amp; Cetak
              </button>
              <a
                href={`https://wa.me/6281234567890?text=${encodeURIComponent(
                  `Halo, berikut nota FreshWash Laundry Anda: Total ${formatRupiah(grandTotal)}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="h-10 rounded-lg border border-emerald-500 text-emerald-700 hover:bg-emerald-50 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim Nota WA
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
