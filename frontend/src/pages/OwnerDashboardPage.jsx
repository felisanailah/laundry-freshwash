import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, ShoppingBag, AlertTriangle, Users, Plus } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import StatusPill from '../components/StatusPill'
import api from '../lib/api'
import { formatRupiah, PAYMENT_METHOD_LABELS } from '../lib/format'

export default function OwnerDashboardPage() {
  const queryClient = useQueryClient()
  const [branchId, setBranchId] = useState('')

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['owner-analytics', branchId],
    queryFn: async () =>
      (
        await api.get('/owner/analytics', {
          params: { branch_id: branchId || undefined },
        })
      ).data,
  })

  const { data: inventory = [] } = useQuery({
    queryKey: ['owner-inventory'],
    queryFn: async () => (await api.get('/owner/inventory')).data,
  })

  const restockMutation = useMutation({
    mutationFn: async ({ id, stock }) =>
      (await api.patch(`/owner/inventory/${id}`, { stock })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['owner-inventory'] }),
  })

  const kpi = analytics?.kpi || {
    total_revenue: 0,
    total_orders: 0,
    unpaid_total: 0,
    active_customers: 0,
  }
  const dailyRevenue = analytics?.daily_revenue || []
  const maxDaily = Math.max(1, ...dailyRevenue.map((d) => Number(d.total || 0)))
  const paymentBreakdown = analytics?.payment_breakdown || []
  const topServices = analytics?.top_services || []
  const branches = analytics?.branches || []
  const couriers = analytics?.couriers || []

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Dashboard Ringkasan Bisnis</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau omzet, performa layanan, dan peringatan stok bahan baku
            </p>
          </div>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="h-10 px-3.5 rounded-xl bg-white border border-slate-200 text-sm font-semibold text-slate-700"
          >
            <option value="">Semua Cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Omzet</span>
              <TrendingUp className="w-4 h-4 text-[#10B981]" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {isLoading ? '...' : formatRupiah(kpi.total_revenue)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Transaksi</span>
              <ShoppingBag className="w-4 h-4 text-[#0284C7]" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {isLoading ? '...' : `${kpi.total_orders} Order`}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Piutang / Belum Lunas</span>
              <AlertTriangle className="w-4 h-4 text-[#F59E0B]" />
            </div>
            <p className="text-2xl font-extrabold text-[#F59E0B] mt-2">
              {isLoading ? '...' : formatRupiah(kpi.unpaid_total)}
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Pelanggan Aktif</span>
              <Users className="w-4 h-4 text-[#0284C7]" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">
              {isLoading ? '...' : `${kpi.active_customers} Pelanggan`}
            </p>
          </div>
        </div>

        {/* Middle Section: Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4">Grafik Pendapatan Harian</h2>
            {dailyRevenue.length === 0 ? (
              <p className="text-sm text-slate-400 py-12 text-center">Belum ada data transaksi.</p>
            ) : (
              <div className="h-52 flex items-end gap-3 pt-4">
                {dailyRevenue.map((d) => {
                  const pct = Math.max(8, Math.round((Number(d.total) / maxDaily) * 100))
                  return (
                    <div key={d.date} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                      <div className="w-full flex items-end justify-center h-40">
                        <div
                          title={`${d.date}: ${formatRupiah(d.total)}`}
                          style={{ height: `${pct}%` }}
                          className="w-full max-w-[36px] rounded-t-lg bg-[#0284C7] hover:bg-[#0369A1] transition-all"
                        />
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 truncate w-full text-center">
                        {d.date.slice(5)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Metode Pembayaran</h2>
            {paymentBreakdown.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Belum ada data.</p>
            ) : (
              <div className="space-y-3">
                {paymentBreakdown.map((pm) => (
                  <div key={pm.method} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">
                        {PAYMENT_METHOD_LABELS[pm.method] || pm.method}
                      </span>
                      <span className="text-slate-900">{pm.percentage}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-[#10B981] rounded-full"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: Top Services, Couriers & Inventory Alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Layanan Terlaris</h2>
            <div className="space-y-3">
              {topServices.map((svc) => (
                <div key={svc.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">{svc.name}</span>
                  <span className="font-bold text-[#0284C7]">{svc.total_orders}x dipesan</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Daftar Kurir Aktif</h2>
            <div className="divide-y divide-slate-100">
              {couriers.map((k) => (
                <div key={k.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{k.name}</p>
                    <p className="text-xs text-slate-500">{k.phone}</p>
                  </div>
                  <StatusPill tone="info">{k.orders_count || 0} tugas aktif</StatusPill>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-bold text-slate-900">Peringatan Stok Bahan Baku</h2>
            <div className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const low = Number(item.stock) <= Number(item.min_stock)
                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                      <p className="text-xs text-slate-500">
                        Sisa: {Number(item.stock)} {item.unit} (Min: {Number(item.min_stock)}{' '}
                        {item.unit})
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={low ? 'danger' : 'success'}>
                        {low ? 'Stok Menipis' : 'Aman'}
                      </StatusPill>
                      <button
                        onClick={() =>
                          restockMutation.mutate({
                            id: item.id,
                            stock: Number(item.stock) + 5,
                          })
                        }
                        title="Tambah 5 unit"
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
