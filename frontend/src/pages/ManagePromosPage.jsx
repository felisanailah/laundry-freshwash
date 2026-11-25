import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Tag, Plus, Copy, Check, Trash2, Power, Calendar, Percent, Banknote, AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import api from '../lib/api'
import { formatRupiah } from '../lib/format'

export default function ManagePromosPage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [copiedCode, setCopiedCode] = useState('')
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percent',
    discount_value: '',
    expires_at: '',
    is_active: true,
  })

  // Fetch all promos
  const { data: promos = [], isLoading } = useQuery({
    queryKey: ['owner-promos'],
    queryFn: async () => (await api.get('/owner/promos')).data,
  })

  // Create Promo Mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/owner/promos', payload)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-promos'] })
      queryClient.invalidateQueries({ queryKey: ['active-promos'] })
      setIsModalOpen(false)
      setFormData({
        code: '',
        discount_type: 'percent',
        discount_value: '',
        expires_at: '',
        is_active: true,
      })
      setFeedback({ type: 'success', message: res.message || 'Kode promo berhasil dibuat!' })
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal membuat kode promo.'
      setFeedback({ type: 'error', message: msg })
    },
  })

  // Toggle Promo Active Mutation
  const toggleMutation = useMutation({
    mutationFn: async (id) => (await api.patch(`/owner/promos/${id}/toggle`)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-promos'] })
      queryClient.invalidateQueries({ queryKey: ['active-promos'] })
      setFeedback({ type: 'success', message: res.message })
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000)
    },
    onError: () => {
      setFeedback({ type: 'error', message: 'Gagal mengubah status promo.' })
    },
  })

  // Delete Promo Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/owner/promos/${id}`)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-promos'] })
      queryClient.invalidateQueries({ queryKey: ['active-promos'] })
      setFeedback({ type: 'success', message: res.message })
      setTimeout(() => setFeedback({ type: '', message: '' }), 3000)
    },
  })

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(''), 2000)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFeedback({ type: '', message: '' })

    const payload = {
      code: formData.code.toUpperCase().trim(),
      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value),
      expires_at: formData.expires_at || null,
      is_active: formData.is_active,
    }

    createMutation.mutate(payload)
  }

  const activeCount = promos.filter((p) => p.is_active).length
  const inactiveCount = promos.length - activeCount

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Tag className="w-7 h-7 text-[#0284C7]" />
              Kelola Kode Promo (Khusus Owner)
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Buat voucher promo diskon untuk dipromosikan ke pelanggan dan digunakan saat checkout
            </p>
          </div>

          <button
            onClick={() => {
              setFeedback({ type: '', message: '' })
              setIsModalOpen(true)
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            + Buat Kode Promo Baru
          </button>
        </div>

        {/* Info Banner: Cara Kerja Promo */}
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/70 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5">
          <Info className="w-5 h-5 text-[#0284C7] shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1">
            <p className="font-bold text-slate-900">
              💡 Cara Memberikan Kode Promo ke Pelanggan:
            </p>
            <p>
              1. <strong>Owner membuat kode promo</strong> di halaman ini (contoh: <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[#0284C7] font-bold">HEMAT20</code> atau <code className="bg-white px-1.5 py-0.5 rounded border border-sky-300 font-mono text-[#0284C7] font-bold">BERSIH10</code>).
            </p>
            <p>
              2. Bagikan kode tersebut di media sosial, banner promo, atau WhatsApp pelanggan.
            </p>
            <p>
              3. Pelanggan memasukkan kode ini di kolom <strong>&quot;Kode Promo&quot;</strong> pada halaman <strong>Pesan Online</strong> atau saat transaksi di <strong>Kasir POS</strong>, dan total cucian langsung otomatis terpotong diskon!
            </p>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback.message && !isModalOpen && (
          <div
            className={`p-4 rounded-xl border flex items-center gap-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Stats Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Kode Promo</span>
              <Tag className="w-4 h-4 text-[#0284C7]" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{promos.length}</p>
            <p className="text-[11px] text-slate-500 mt-1">Semua voucher yang pernah dibuat</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Promo Aktif &amp; Siap Pakai</span>
              <Power className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-extrabold text-emerald-600 mt-2">{activeCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Bisa langsung digunakan oleh pelanggan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Promo Nonaktif</span>
              <Power className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-2xl font-extrabold text-slate-600 mt-2">{inactiveCount}</p>
            <p className="text-[11px] text-slate-500 mt-1">Ditangguhkan / kedaluwarsa</p>
          </div>
        </div>

        {/* Table Promo */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="text-sm font-bold text-slate-900">Daftar Voucher Promo Tersedia</h2>
            <span className="text-xs text-slate-500">{promos.length} voucher terdaftar</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50">
                  <th className="px-5 py-3.5">Kode Promo (Kupon)</th>
                  <th className="px-5 py-3.5">Besaran Diskon</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Berlaku Hingga</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-400">
                      Memuat daftar kode promo...
                    </td>
                  </tr>
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <Tag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">Belum ada kode promo</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Klik &quot;+ Buat Kode Promo Baru&quot; untuk membuat promo diskon pertama Anda
                      </p>
                    </td>
                  </tr>
                ) : (
                  promos.map((p) => {
                    const isPercent = p.discount_type === 'percent'
                    const isCopied = copiedCode === p.code

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold px-2.5 py-1 bg-sky-50 text-[#0284C7] border border-sky-200/80 rounded-lg">
                              {p.code}
                            </span>
                            <button
                              onClick={() => handleCopy(p.code)}
                              title="Salin Kode Promo"
                              className="p-1 text-slate-400 hover:text-slate-600 rounded hover:bg-slate-100 transition"
                            >
                              {isCopied ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            {isCopied && (
                              <span className="text-[10px] text-emerald-600 font-semibold">Tersalin!</span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-slate-800">
                            {isPercent ? (
                              <Percent className="w-3.5 h-3.5 text-sky-600" />
                            ) : (
                              <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {isPercent
                              ? `${p.discount_value}% Diskon`
                              : `Potongan ${formatRupiah(p.discount_value)}`}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <button
                            onClick={() => toggleMutation.mutate(p.id)}
                            title="Klik untuk aktifkan / nonaktifkan"
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition ${
                              p.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                p.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                              }`}
                            />
                            {p.is_active ? 'Aktif (Berlaku)' : 'Nonaktif'}
                          </button>
                        </td>

                        <td className="px-5 py-4 text-xs text-slate-500">
                          {p.expires_at ? (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(p.expires_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Tanpa batas waktu</span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => {
                              if (confirm(`Hapus kode promo "${p.code}"?`)) {
                                deleteMutation.mutate(p.id)
                              }
                            }}
                            title="Hapus promo"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
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
      </main>

      {/* Modal Buat Kode Promo Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Buat Kode Promo Baru</h3>
                <p className="text-xs text-slate-500">
                  Tentukan kupon diskon untuk menarik pelanggan laundry
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {feedback.message && feedback.type === 'error' && (
                <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{feedback.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Kode Promo (Huruf Kapital) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: HEMAT20, PROMOSIKAT, DISKON10"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3.5 py-2.5 text-sm font-mono font-bold uppercase bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Kode ini yang akan dimasukkan pelanggan di kolom voucher promo.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipe Diskon <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="percent">Persentase (%)</option>
                    <option value="fixed">Nominal Tetap (Rp)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nilai Diskon <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder={formData.discount_type === 'percent' ? 'Contoh: 20' : 'Contoh: 15000'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Berlaku Sampai Tanggal <span className="text-slate-400 font-normal">(Opsional)</span>
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {createMutation.isPending ? 'Menyimpan...' : 'Buat Kode Promo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
