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
  Receipt,
  FileText,
  X,
  Phone,
  Eye,
  Store,
  Truck,
  Tag,
  ArrowRight,
  ClipboardList,
} from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import StatusPill from '../components/StatusPill'
import api from '../lib/api'
import {
  formatRupiah,
  formatDateTime,
  ORDER_STATUS_META,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_META,
  PAYMENT_METHOD_LABELS,
} from '../lib/format'

const CATEGORIES = [
  { key: 'all', label: 'Semua' },
  { key: 'kiloan', label: 'Kiloan' },
  { key: 'satuan', label: 'Satuan' },
  { key: 'ekspres', label: 'Ekspres' },
  { key: 'sepatu_tas', label: 'Sepatu & Tas' },
]

export default function PosPage() {
  const queryClient = useQueryClient()

  // Tabs: 'pos' (buat transaksi) atau 'tracking' (pantau status progres cucian)
  const [activeTab, setActiveTab] = useState('pos')

  // POS State
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [orderType, setOrderType] = useState('walk_in')
  const [customerId, setCustomerId] = useState('')
  const [courierId, setCourierId] = useState('')
  const [cart, setCart] = useState([])
  const [promoCode, setPromoCode] = useState('')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [appliedPromoObj, setAppliedPromoObj] = useState(null)
  const [notes, setNotes] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('dp')
  const [dpAmount, setDpAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('cash')

  // Customer baru state
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustWa, setNewCustWa] = useState('')

  // Receipt Modal State
  const [lastSavedOrder, setLastSavedOrder] = useState(null)
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null)

  // Tracking Search in Kasir
  const [trackingSearch, setTrackingSearch] = useState('')
  const [trackingStatusFilter, setTrackingStatusFilter] = useState('all')

  // Queries
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

  const { data: activePromos = [] } = useQuery({
    queryKey: ['active-promos'],
    queryFn: async () => (await api.get('/promos/active')).data,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => (await api.get('/admin/orders')).data,
  })

  const allOrders = ordersData?.orders || []

  // Service filters
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const matchCat = category === 'all' || s.category === category
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      return matchCat && matchSearch
    })
  }, [services, category, search])

  // Cart operations
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

  const updateCartQty = (serviceId, qty) => {
    setCart((prev) => {
      const val = Math.max(0, parseFloat(qty) || 0)
      if (val === 0) return prev.filter((item) => item.service.id !== serviceId)
      return prev.map((item) =>
        item.service.id === serviceId ? { ...item, quantity: val } : item
      )
    })
  }

  const removeFromCart = (serviceId) => {
    setCart((prev) => prev.filter((item) => item.service.id !== serviceId))
  }

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) =>
          acc + Math.round(Number(item.service.price) * Number(item.quantity || 0)),
        0
      ),
    [cart]
  )

  const discount = useMemo(() => {
    if (!appliedPromoObj || subtotal <= 0) return 0
    if (appliedPromoObj.discount_type === 'percent') {
      return Math.round((subtotal * Number(appliedPromoObj.discount_value)) / 100)
    }
    return Math.min(subtotal, Number(appliedPromoObj.discount_value))
  }, [appliedPromoObj, subtotal])

  const grandTotal = Math.max(0, subtotal - discount)

  const applyPromo = async (codeToApply) => {
    const code = (codeToApply || promoCode).trim().toUpperCase()
    if (!code) return
    try {
      const { data } = await api.get('/promos/validate', {
        params: { code },
      })
      setAppliedPromoObj(data)
      setPromoCode(data.code)
      if (data.discount_type === 'percent') {
        setDiscountPercent(Number(data.discount_value))
      }
    } catch {
      setAppliedPromoObj(null)
      setDiscountPercent(0)
    }
  }

  // Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/admin/customers', { name: newCustName, whatsapp: newCustWa })).data,
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
      setCustomerId(String(created.id))
      setNewCustName('')
      setNewCustWa('')
      setShowNewCustomer(false)
    },
  })

  // Save POS Order Mutation
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
      // Set last saved order dan otomatis buka modal nota baru!
      setLastSavedOrder(data)
      setSelectedOrderForReceipt(data)
      setShowReceiptModal(true)

      // Reset form kasir untuk transaksi baru
      setCart([])
      setNotes('')
      setPromoCode('')
      setAppliedPromoObj(null)
      setDiscountPercent(0)
      setCustomerId('')
      setCourierId('')
      setDpAmount('')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  // Filtered orders for tracking tab in kasir
  const filteredOrders = useMemo(() => {
    return allOrders.filter((ord) => {
      const matchSearch =
        ord.invoice_code.toLowerCase().includes(trackingSearch.toLowerCase()) ||
        (ord.customer?.name || '').toLowerCase().includes(trackingSearch.toLowerCase()) ||
        (ord.customer?.whatsapp || '').includes(trackingSearch)
      const matchStatus =
        trackingStatusFilter === 'all' || ord.status === trackingStatusFilter
      return matchSearch && matchStatus
    })
  }, [allOrders, trackingSearch, trackingStatusFilter])

  // Helper WhatsApp Nota
  const getWhatsappNotaUrl = (order) => {
    if (!order || !order.customer?.whatsapp) return '#'
    let phone = String(order.customer.whatsapp).replace(/\D/g, '')
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1)
    }

    const itemsText =
      order.items
        ?.map(
          (it) =>
            `• ${it.service?.name || 'Layanan'} (${it.quantity} ${it.service?.unit || ''})`
        )
        .join('\n') || ''

    const paymentStatusText =
      order.payment?.status === 'lunas'
        ? 'LUNAS (100%)'
        : order.payment?.status === 'dp'
        ? `DP: ${formatRupiah(order.payment?.dp_amount)} (Sisa Pelunasan: ${formatRupiah(
            order.payment?.remaining_amount
          )})`
        : 'BELUM LUNAS'

    const statusProgressText = ORDER_STATUS_META[order.status]?.label || order.status

    const message = `Halo Kak ${order.customer.name}! 🧺
Terima kasih telah mencuci di FreshWash Laundry.

Berikut detail nota transaksi Anda:
📄 *No. Nota:* ${order.invoice_code}
📅 *Tanggal:* ${formatDateTime(order.created_at)}
📦 *Pengantaran:* ${ORDER_TYPE_LABELS[order.order_type] || order.order_type}

✨ *Rincian Layanan:*
${itemsText}

💰 *Total Biaya:* ${formatRupiah(order.total)}
💳 *Status Pembayaran:* ${paymentStatusText}
📍 *Status Progres Cucian:* ${statusProgressText}

Kakak bisa memantau progres cucian kapan saja secara online di:
${window.location.origin}/#lacak

Terima kasih atas kepercayaannya! 🙏`

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
  }

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Kasir: Switch Tab & Last Order Info */}
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('pos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'pos'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Store className="w-4 h-4" />
              1. Input Transaksi Kasir (POS)
            </button>

            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === 'tracking'
                  ? 'bg-[#0284C7] text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              2. Pantau Status &amp; Progres Cucian
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-sky-100 text-sky-800 text-[10px]">
                {allOrders.length}
              </span>
            </button>
          </div>

          {/* Quick Info Nota Terakhir */}
          {lastSavedOrder && (
            <button
              onClick={() => {
                setSelectedOrderForReceipt(lastSavedOrder)
                setShowReceiptModal(true)
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition"
            >
              <Receipt className="w-3.5 h-3.5 text-emerald-600" />
              <span>Nota Terakhir: <strong>{lastSavedOrder.invoice_code}</strong></span>
              <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.5 rounded">
                Lihat Nota
              </span>
            </button>
          )}
        </div>

        {/* Tab 1: POS Screen */}
        {activeTab === 'pos' && (
          <div className="flex-1 flex flex-col lg:flex-row min-w-0">
            {/* Left 60%: Service Catalog */}
            <div className="lg:w-3/5 p-4 sm:p-6 space-y-5 overflow-y-auto">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Kasir / Point of Sale</h1>
                  <p className="text-xs text-slate-500">
                    Pilih layanan untuk ditambahkan ke transaksi pelanggan
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari layanan..."
                    className="w-full h-10 pl-9 pr-3 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setCategory(cat.key)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                      category === cat.key
                        ? 'bg-[#0284C7] text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Service Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {filteredServices.map((svc) => (
                  <div
                    key={svc.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-slate-900 text-sm">{svc.name}</h3>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase">
                          {svc.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3" /> ~{svc.estimated_hours} jam
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Harga/{svc.unit}</span>
                        <p className="font-extrabold text-[#0284C7] text-base">
                          {formatRupiah(svc.price)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addToCart(svc)}
                        className="px-3 py-1.5 rounded-xl bg-sky-50 text-[#0284C7] hover:bg-[#0284C7] hover:text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Tambah
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 40%: Cart & Checkout */}
            <div className="lg:w-2/5 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-4 sm:p-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#0284C7]" />
                    Keranjang Transaksi Kasir
                  </h2>
                  <span className="text-xs text-slate-500 font-semibold">{cart.length} item</span>
                </div>

                {/* Delivery Option */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Metode Pengantaran
                  </label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                  >
                    <option value="walk_in">Datang Sendiri ke Toko (Walk-In)</option>
                    <option value="delivery_only">Diantar Kurir ke Rumah (Delivery)</option>
                    <option value="pickup_only">Dijemput Kurir (Pick-Up)</option>
                    <option value="pickup_delivery">Antar-Jemput Kurir Lengkap</option>
                  </select>
                </div>

                {/* Courier selection if not walk_in */}
                {orderType !== 'walk_in' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Pilih Kurir Pengantar
                    </label>
                    <select
                      value={courierId}
                      onChange={(e) => setCourierId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-sky-300 text-xs font-semibold text-slate-700 bg-sky-50"
                    >
                      <option value="">-- Pilih Kurir Bertugas --</option>
                      {couriers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer selection */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Pelanggan</label>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(!showNewCustomer)}
                      className="text-xs text-[#0284C7] font-semibold hover:underline flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      {showNewCustomer ? 'Pilih yang sudah ada' : '+ Pelanggan Baru'}
                    </button>
                  </div>

                  {!showNewCustomer ? (
                    <select
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                    >
                      <option value="">-- Pilih Pelanggan --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.whatsapp})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 text-xs bg-white"
                      />
                      <input
                        type="tel"
                        placeholder="No WhatsApp (0812...)"
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
                        Simpan Pelanggan Baru
                      </button>
                    </div>
                  )}
                </div>

                {/* Cart Items List */}
                <div className="border-y border-slate-100 py-3 space-y-2.5 max-h-52 overflow-y-auto">
                  {cart.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      Belum ada layanan dipilih. Klik layanan di sebelah kiri untuk menambah ke nota.
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
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Promo & Notes */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Kode Promo (HEMAT20)"
                        className="w-full h-9 px-2.5 rounded-lg border border-slate-200 text-xs font-mono font-bold uppercase"
                      />
                      <button
                        type="button"
                        onClick={() => applyPromo()}
                        className="px-2.5 h-9 rounded-lg bg-[#0284C7] text-white text-xs font-semibold hover:bg-[#0369A1]"
                      >
                        Pakai
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

                  {/* Promo aktif yang dibuat owner */}
                  {activePromos.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-slate-400 font-medium">Voucher Owner:</span>
                      {activePromos.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => applyPromo(p.code)}
                          className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border transition ${
                            appliedPromoObj?.code === p.code
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-400'
                              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-sky-50 hover:text-sky-700'
                          }`}
                        >
                          {p.code} (
                          {p.discount_type === 'percent'
                            ? `${p.discount_value}%`
                            : formatRupiah(p.discount_value)}
                          )
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment & Action */}
              <div className="space-y-3 pt-3 border-t border-slate-200 mt-4">
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatRupiah(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Diskon ({appliedPromoObj?.code || 'Kupon'})</span>
                      <span>-{formatRupiah(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                    <span>Grand Total</span>
                    <span className="text-[#0284C7]">{formatRupiah(grandTotal)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={paymentStatus}
                    onChange={(e) => setPaymentStatus(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="dp">Bayar DP Dulu (50% / Custom)</option>
                    <option value="lunas">Bayar Lunas Langsung</option>
                    <option value="belum_lunas">Bayar Nanti (Belum Lunas)</option>
                  </select>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-9 px-2.5 rounded-xl border border-slate-200 text-xs font-semibold"
                  >
                    <option value="cash">Tunai / Cash</option>
                    <option value="qris">QRIS</option>
                    <option value="transfer">Transfer Bank</option>
                  </select>
                </div>

                {paymentStatus === 'dp' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
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
                          Math.max(
                            0,
                            grandTotal - Number(dpAmount || Math.round(grandTotal * 0.5))
                          )
                        )}
                      </strong>
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={!customerId || cart.length === 0 || saveOrderMutation.isPending}
                  onClick={() => saveOrderMutation.mutate()}
                  className="w-full h-11 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  {saveOrderMutation.isPending
                    ? 'Menyimpan & Membuat Nota...'
                    : 'Simpan Transaksi & Cetak Nota'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tracking & Progress Screen for Kasir */}
        {activeTab === 'tracking' && (
          <div className="p-4 sm:p-6 lg:p-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#0284C7]" />
                  Pantau Status &amp; Progres Cucian Pelanggan
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cek langsung progres cucian saat pelanggan menanyakan status baju mereka
                </p>
              </div>

              {/* Quick Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari No. Nota atau Nama..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Status Filter Buttons */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: 'all', label: 'Semua Status' },
                { key: 'dijemput', label: 'Dijemput' },
                { key: 'dicuci', label: 'Sedang Dicuci' },
                { key: 'disetrika', label: 'Sedang Disetrika' },
                { key: 'siap_diantar', label: 'Siap Diambil/Diantar' },
                { key: 'selesai', label: 'Selesai' },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setTrackingStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                    trackingStatusFilter === st.key
                      ? 'bg-sky-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50">
                      <th className="px-5 py-3.5">No. Nota &amp; Tanggal</th>
                      <th className="px-5 py-3.5">Pelanggan</th>
                      <th className="px-5 py-3.5">Layanan</th>
                      <th className="px-5 py-3.5">Status Progres Cucian</th>
                      <th className="px-5 py-3.5">Pembayaran</th>
                      <th className="px-5 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center">
                          <ClipboardList className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm font-semibold text-slate-600">
                            Tidak ada pesanan ditemukan
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Coba ubah kata kunci pencarian atau filter status
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => {
                        const statusMeta = ORDER_STATUS_META[ord.status] || {
                          label: ord.status,
                          tone: 'info',
                        }
                        const paymentMeta = PAYMENT_STATUS_META[ord.payment?.status] || {
                          label: ord.payment?.status,
                          tone: 'neutral',
                        }

                        return (
                          <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-4">
                              <span className="font-mono text-xs font-bold text-[#0284C7] bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                                {ord.invoice_code}
                              </span>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {formatDateTime(ord.created_at)}
                              </p>
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900 leading-tight">
                                {ord.customer?.name}
                              </p>
                              <a
                                href={`https://wa.me/${String(ord.customer?.whatsapp).replace(
                                  /\D/g,
                                  ''
                                )}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                              >
                                <Phone className="w-3 h-3" />
                                {ord.customer?.whatsapp}
                              </a>
                            </td>

                            <td className="px-5 py-4">
                              <div className="text-xs text-slate-700 space-y-0.5">
                                {ord.items?.map((it, idx) => (
                                  <div key={idx} className="truncate max-w-xs">
                                    • {it.service?.name} ({it.quantity} {it.service?.unit})
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="px-5 py-4">
                              <StatusPill tone={statusMeta.tone} dot>
                                {statusMeta.label}
                              </StatusPill>
                              {ord.courier && (
                                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                  <Truck className="w-3 h-3 text-sky-600" />
                                  Kurir: {ord.courier.name}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4">
                              <p className="font-bold text-slate-900">{formatRupiah(ord.total)}</p>
                              <div className="mt-1">
                                <StatusPill tone={paymentMeta.tone} className="text-[10px] py-0.5">
                                  {paymentMeta.label}
                                </StatusPill>
                              </div>
                              {ord.payment?.status === 'dp' && (
                                <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                  Sisa: {formatRupiah(ord.payment?.remaining_amount)}
                                </p>
                              )}
                            </td>

                            <td className="px-5 py-4 text-right">
                              <button
                                onClick={() => {
                                  setSelectedOrderForReceipt(ord)
                                  setShowReceiptModal(true)
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#0284C7] transition"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Nota
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL STRUK NOTA RESMI KASIR */}
      {showReceiptModal && selectedOrderForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-sky-50/70">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Nota Resmi FreshWash Laundry
                </h3>
              </div>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div id="printable-receipt" className="p-6 space-y-4 overflow-y-auto text-slate-800 text-xs">
              {/* Brand Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300">
                <h2 className="text-lg font-black tracking-tight text-slate-900">
                  FreshWash <span className="text-[#0284C7]">Laundry</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Bersih Wangi &bull; Tepat Waktu &bull; Layanan Terpercaya
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Jl. Raya Jemursari No. 45, Surabaya &bull; Telp/WA: 0812-3456-7890
                </p>
              </div>

              {/* Invoice Info */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">No. Nota:</span>
                  <span className="font-mono font-black text-sm text-[#0284C7]">
                    {selectedOrderForReceipt.invoice_code}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Tanggal / Waktu:</span>
                  <span>{formatDateTime(selectedOrderForReceipt.created_at)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Nama Pelanggan:</span>
                  <span className="font-bold text-slate-900">
                    {selectedOrderForReceipt.customer?.name}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">No. WhatsApp:</span>
                  <span>{selectedOrderForReceipt.customer?.whatsapp}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Jenis Pengantaran:</span>
                  <span className="font-semibold text-slate-800">
                    {ORDER_TYPE_LABELS[selectedOrderForReceipt.order_type] ||
                      selectedOrderForReceipt.order_type}
                  </span>
                </div>
                {selectedOrderForReceipt.courier && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Kurir Pengantar:</span>
                    <span className="font-semibold text-[#0284C7]">
                      {selectedOrderForReceipt.courier.name}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Status Progres Cucian:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">
                    {ORDER_STATUS_META[selectedOrderForReceipt.status]?.label ||
                      selectedOrderForReceipt.status}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                  Rincian Cucian:
                </p>
                <div className="border-y border-dashed border-slate-300 py-2 space-y-1.5">
                  {selectedOrderForReceipt.items?.map((it, idx) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {it.service?.name || 'Layanan'}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {it.quantity} {it.service?.unit} &times; {formatRupiah(it.unit_price)}
                        </p>
                      </div>
                      <span className="font-bold text-slate-900">{formatRupiah(it.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatRupiah(selectedOrderForReceipt.subtotal)}</span>
                </div>
                {Number(selectedOrderForReceipt.discount || 0) > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Diskon Voucher</span>
                    <span>-{formatRupiah(selectedOrderForReceipt.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Grand Total</span>
                  <span className="text-[#0284C7]">
                    {formatRupiah(selectedOrderForReceipt.total)}
                  </span>
                </div>

                {/* Payment Detail */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-600">Status Pembayaran:</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {selectedOrderForReceipt.payment?.status === 'lunas'
                        ? 'LUNAS'
                        : selectedOrderForReceipt.payment?.status === 'dp'
                        ? 'BAYAR DP 50%'
                        : 'BELUM LUNAS'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metode Bayar:</span>
                    <span className="font-medium">
                      {PAYMENT_METHOD_LABELS[selectedOrderForReceipt.payment?.method] ||
                        selectedOrderForReceipt.payment?.method}
                    </span>
                  </div>
                  {selectedOrderForReceipt.payment?.status === 'dp' && (
                    <>
                      <div className="flex justify-between text-emerald-700 font-semibold">
                        <span>DP Dibayar:</span>
                        <span>{formatRupiah(selectedOrderForReceipt.payment?.dp_amount)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200 pt-1">
                        <span>Sisa Pelunasan:</span>
                        <span>{formatRupiah(selectedOrderForReceipt.payment?.remaining_amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-3 text-[10px] text-slate-400 space-y-0.5">
                <p>Simpan nota ini sebagai bukti pengambilan cucian.</p>
                <p>Terima kasih atas kepercayaan Anda di FreshWash!</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={handlePrintReceipt}
                className="flex-1 py-2.5 px-3 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-4 h-4" />
                Cetak Struk Nota
              </button>

              <a
                href={getWhatsappNotaUrl(selectedOrderForReceipt)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
              >
                <MessageCircle className="w-4 h-4" />
                Kirim Nota WA Pelanggan
              </a>

              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 text-xs font-bold transition"
              >
                Tutup &bull; Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
