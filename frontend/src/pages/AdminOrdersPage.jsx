import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, ArrowRight, MessageCircle } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import StatusPill from '../components/StatusPill'
import api from '../lib/api'
import { formatDateTime, formatRupiah, ORDER_STATUS_META, ORDER_TYPE_LABELS, PAYMENT_STATUS_META } from '../lib/format'

const STATUS_FLOW = ['dijemput', 'dicuci', 'disetrika', 'siap_diantar', 'selesai']

export default function AdminOrdersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [orderType, setOrderType] = useState('all')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', search, orderType],
    queryFn: async () => {
      const { data: res } = await api.get('/admin/orders', {
        params: {
          search: search || undefined,
          order_type: orderType !== 'all' ? orderType : undefined,
        },
      })
      return res
    },
  })

  const [alertError, setAlertError] = useState('')

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.patch(`/admin/orders/${id}/status`, { status })).data,
    onSuccess: () => {
      setAlertError('')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
    onError: (err) => {
      setAlertError(
        err.response?.data?.message || 'Gagal mengubah status. Pastikan kurir sudah dipilih.'
      )
    },
  })

  const updatePaymentMutation = useMutation({
    mutationFn: async ({ id, status }) =>
      (await api.patch(`/admin/orders/${id}/payment`, { status })).data,
    onSuccess: () => {
      setAlertError('')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  const { data: couriers = [] } = useQuery({
    queryKey: ['admin-couriers'],
    queryFn: async () => (await api.get('/admin/couriers')).data,
  })

  const assignCourierMutation = useMutation({
    mutationFn: async ({ id, courier_id }) =>
      (await api.patch(`/admin/orders/${id}/courier`, { courier_id: courier_id || null })).data,
    onSuccess: () => {
      setAlertError('')
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
    },
  })

  const orders = data?.orders || []
  const kpi = data?.kpi || { dijemput: 0, dicuci: 0, disetrika: 0, siap_diantar: 0 }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manajemen Status &amp; Kurir</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau progres pengerjaan cucian dan status pembayaran pelanggan
            </p>
          </div>
          <Link
            to="/admin/pos"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Input Order Baru
          </Link>
        </div>

        {/* Top 4 KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Perlu Dijemput</p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">{kpi.dijemput}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Sedang Dicuci</p>
            <p className="text-2xl font-extrabold text-[#0284C7] mt-1">{kpi.dicuci}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Proses Setrika</p>
            <p className="text-2xl font-extrabold text-[#F59E0B] mt-1">{kpi.disetrika}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-semibold text-slate-500">Siap Diantar / Diambil</p>
            <p className="text-2xl font-extrabold text-[#10B981] mt-1">{kpi.siap_diantar}</p>
          </div>
        </div>

        {/* Alert Error Kurir */}
        {alertError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-base">⚠️</span>
              <span>{alertError}</span>
            </div>
            <button
              onClick={() => setAlertError('')}
              className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 rounded"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode invoice atau nama pelanggan..."
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:border-[#0284C7]"
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'Semua' },
              { key: 'pickup_delivery', label: 'Antar-Jemput' },
              { key: 'pickup_only', label: 'Pick-Up' },
              { key: 'delivery_only', label: 'Delivery' },
              { key: 'walk_in', label: 'Walk-In' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setOrderType(tab.key)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                  orderType === tab.key
                    ? 'bg-[#0284C7] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500">
                  <th className="py-3.5 px-4">Invoice &amp; Waktu</th>
                  <th className="py-3.5 px-4">Pelanggan</th>
                  <th className="py-3.5 px-4">Layanan &amp; Total</th>
                  <th className="py-3.5 px-4">Tipe &amp; Kurir</th>
                  <th className="py-3.5 px-4">Status Pengerjaan</th>
                  <th className="py-3.5 px-4">Pembayaran</th>
                  <th className="py-3.5 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Memuat data pesanan...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Belum ada data pesanan.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const currentIdx = STATUS_FLOW.indexOf(order.status)
                    const nextStatus =
                      currentIdx >= 0 && currentIdx < STATUS_FLOW.length - 1
                        ? STATUS_FLOW[currentIdx + 1]
                        : null
                    const statusMeta = ORDER_STATUS_META[order.status] || {
                      label: order.status,
                      tone: 'neutral',
                    }

                    return (
                      <tr key={order.id} className="hover:bg-slate-50/70">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-slate-900">{order.invoice_code}</p>
                          <p className="text-xs text-slate-500">{formatDateTime(order.created_at)}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-900">{order.customer?.name}</p>
                          <a
                            href={`https://wa.me/${order.customer?.whatsapp?.replace(/^0/, '62')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                          >
                            <MessageCircle className="w-3 h-3" /> {order.customer?.whatsapp}
                          </a>
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="text-xs font-medium text-slate-700">
                            {order.items?.[0]?.service?.name}
                            {order.items?.length > 1 ? ` + ${order.items.length - 1} item` : ''}
                          </p>
                          <p className="text-xs font-bold text-slate-900">
                            {formatRupiah(order.total)}
                          </p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1.5">
                            <StatusPill tone={order.order_type === 'walk_in' ? 'neutral' : 'info'}>
                              {ORDER_TYPE_LABELS[order.order_type] || order.order_type}
                            </StatusPill>
                            {order.order_type !== 'walk_in' && (
                              <div className="space-y-1">
                                <select
                                  value={order.courier_id || ''}
                                  onChange={(e) =>
                                    assignCourierMutation.mutate({
                                      id: order.id,
                                      courier_id: e.target.value ? Number(e.target.value) : null,
                                    })
                                  }
                                  className={`block w-full max-w-[170px] h-7 px-2 rounded-md border text-[11px] font-semibold transition ${
                                    !order.courier_id
                                      ? 'border-rose-400 bg-rose-50 text-rose-700 animate-pulse'
                                      : 'border-slate-200 bg-white text-slate-700'
                                  }`}
                                >
                                  <option value="">⚠️ Pilih Kurir Pengantar</option>
                                  {couriers.map((k) => (
                                    <option key={k.id} value={k.id}>
                                      {k.name} ({k.phone})
                                    </option>
                                  ))}
                                </select>
                                {!order.courier_id && (
                                  <span className="text-[10px] text-rose-600 font-bold block">
                                    ⚠️ Wajib ada kurir pengantar!
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusPill tone={statusMeta.tone} dot>
                            {statusMeta.label}
                          </StatusPill>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <StatusPill
                              tone={PAYMENT_STATUS_META[order.payment?.status]?.tone || 'neutral'}
                            >
                              {PAYMENT_STATUS_META[order.payment?.status]?.label || 'Belum Lunas'}
                            </StatusPill>
                            {order.payment?.status !== 'lunas' && (
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-semibold text-amber-700">
                                  Sisa: {formatRupiah(order.payment?.remaining_amount ?? order.total)}
                                </span>
                                <button
                                  onClick={() =>
                                    updatePaymentMutation.mutate({
                                      id: order.id,
                                      status: 'lunas',
                                    })
                                  }
                                  className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                                >
                                  Lunasi
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {nextStatus ? (
                            (() => {
                              const isCourierMissing =
                                order.order_type !== 'walk_in' &&
                                !order.courier_id &&
                                ['dijemput', 'siap_diantar', 'selesai'].includes(nextStatus)

                              if (isCourierMissing) {
                                return (
                                  <button
                                    onClick={() =>
                                      setAlertError(
                                        `Pesanan ${order.invoice_code} membutuhkan kurir (${ORDER_TYPE_LABELS[order.order_type]}). Harap pilih dan tugaskan kurir terlebih dahulu sebelum lanjut ke status ${ORDER_STATUS_META[nextStatus]?.label}!`
                                      )
                                    }
                                    title="Pilih kurir pengantar terlebih dahulu!"
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-colors"
                                  >
                                    <span>⚠️ Pilih Kurir</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                  </button>
                                )
                              }

                              return (
                                <button
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: order.id,
                                      status: nextStatus,
                                    })
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-50 text-[#0284C7] hover:bg-[#0284C7] hover:text-white text-xs font-semibold transition-colors"
                                >
                                  {ORDER_STATUS_META[nextStatus]?.label}
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              )
                            })()
                          ) : (
                            <span className="text-xs font-semibold text-emerald-600">Tuntas</span>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
