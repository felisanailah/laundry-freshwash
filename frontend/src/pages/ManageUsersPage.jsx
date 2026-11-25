import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Users, UserPlus, Shield, Store, Mail, Key, Trash2, Edit2, Search, CheckCircle, AlertCircle, X } from 'lucide-react'
import AdminSidebar from '../components/AdminSidebar'
import api from '../lib/api'

export default function ManageUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [feedback, setFeedback] = useState({ type: '', message: '' })

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'kasir',
    branch_id: '',
  })

  // Fetch users & branches
  const { data, isLoading } = useQuery({
    queryKey: ['owner-users'],
    queryFn: async () => (await api.get('/owner/users')).data,
  })

  const users = data?.users || []
  const branches = data?.branches || []

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload) => (await api.post('/owner/users', payload)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-users'] })
      closeModal()
      setFeedback({ type: 'success', message: res.message || 'Karyawan berhasil ditambahkan!' })
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal menambahkan user karyawan.'
      setFeedback({ type: 'error', message: msg })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => (await api.put(`/owner/users/${id}`, payload)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-users'] })
      closeModal()
      setFeedback({ type: 'success', message: res.message || 'Data karyawan berhasil diperbarui!' })
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal memperbarui user.'
      setFeedback({ type: 'error', message: msg })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => (await api.delete(`/owner/users/${id}`)).data,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['owner-users'] })
      setDeleteTarget(null)
      setFeedback({ type: 'success', message: res.message || 'User berhasil dihapus.' })
      setTimeout(() => setFeedback({ type: '', message: '' }), 4000)
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Gagal menghapus user.'
      setFeedback({ type: 'error', message: msg })
      setDeleteTarget(null)
    },
  })

  const openAddModal = () => {
    setEditingUser(null)
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'kasir',
      branch_id: branches[0]?.id ? String(branches[0].id) : '',
    })
    setFeedback({ type: '', message: '' })
    setIsModalOpen(true)
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      branch_id: user.branch_id ? String(user.branch_id) : '',
    })
    setFeedback({ type: '', message: '' })
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingUser(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setFeedback({ type: '', message: '' })

    const payload = {
      name: formData.name,
      email: formData.email,
      role: formData.role,
      branch_id: formData.branch_id ? Number(formData.branch_id) : null,
    }

    if (editingUser) {
      if (formData.password.trim()) {
        payload.password = formData.password
      }
      updateMutation.mutate({ id: editingUser.id, payload })
    } else {
      payload.password = formData.password
      createMutation.mutate(payload)
    }
  }

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'all' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const totalUsers = users.length
  const totalKasir = users.filter((u) => u.role === 'kasir').length
  const totalOwner = users.filter((u) => u.role === 'owner').length

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 min-w-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
              <Users className="w-7 h-7 text-[#0284C7]" />
              Kelola Karyawan &amp; User
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tambah dan atur hak akses karyawan (Kasir &amp; Owner) untuk tiap cabang laundry
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold rounded-xl shadow-sm shadow-sky-500/20 transition"
          >
            <UserPlus className="w-4 h-4" />
            + Tambah Karyawan Baru
          </button>
        </div>

        {/* Global Feedback Alert */}
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

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Karyawan / Akun</span>
              <Users className="w-4 h-4 text-[#0284C7]" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900 mt-2">{totalUsers}</p>
            <p className="text-[11px] text-slate-500 mt-1">Akun aktif terdaftar dalam sistem</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Staf Kasir</span>
              <Store className="w-4 h-4 text-sky-600" />
            </div>
            <p className="text-2xl font-extrabold text-sky-700 mt-2">{totalKasir}</p>
            <p className="text-[11px] text-slate-500 mt-1">Akses POS kasir &amp; operasional pesanan</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Owner &amp; Manajemen</span>
              <Shield className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-extrabold text-purple-700 mt-2">{totalOwner}</p>
            <p className="text-[11px] text-slate-500 mt-1">Akses penuh laporan keuangan &amp; kontrol</p>
          </div>
        </div>

        {/* Table & Controls Section */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700"
              >
                <option value="all">Semua Role</option>
                <option value="kasir">Hanya Kasir</option>
                <option value="owner">Hanya Owner</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider font-semibold text-slate-500 bg-slate-50">
                  <th className="px-5 py-3.5">Nama &amp; Email</th>
                  <th className="px-5 py-3.5">Hak Akses (Role)</th>
                  <th className="px-5 py-3.5">Cabang Penugasan</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-slate-400">
                      Memuat data karyawan...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-12 text-center">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-600">Tidak ada user ditemukan</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Klik tombol &quot;+ Tambah Karyawan Baru&quot; untuk menambahkan akun
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwnerRole = u.role === 'owner'
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                                isOwnerRole
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-sky-100 text-[#0284C7]'
                              }`}
                            >
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 leading-tight">{u.name}</p>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isOwnerRole
                                ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                : 'bg-sky-50 text-[#0284C7] border border-sky-200'
                            }`}
                          >
                            {isOwnerRole ? (
                              <Shield className="w-3 h-3 text-purple-600" />
                            ) : (
                              <Store className="w-3 h-3 text-sky-600" />
                            )}
                            {isOwnerRole ? 'Owner / Pengelola' : 'Kasir Staf'}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span className="text-xs font-medium text-slate-700">
                            {u.branch?.name || 'Semua Cabang (Pusat)'}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => openEditModal(u)}
                              title="Edit user"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setDeleteTarget(u)}
                              title="Hapus user"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Modal Add / Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingUser ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingUser
                    ? 'Perbarui profil akses karyawan'
                    : 'Buat akun agar karyawan dapat mengakses sistem FreshWash'}
                </p>
              </div>
              <button
                onClick={closeModal}
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
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Siti Aminah"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Email (Login) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Contoh: siti@freshwash.id"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password{' '}
                  {editingUser ? (
                    <span className="text-slate-400 font-normal">(Kosongkan jika tidak diubah)</span>
                  ) : (
                    <span className="text-rose-500">*</span>
                  )}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required={!editingUser}
                    minLength={6}
                    placeholder={editingUser ? '••••••••' : 'Minimal 6 karakter'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Hak Akses (Role) <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="kasir">Kasir (POS &amp; Orders)</option>
                    <option value="owner">Owner (Akses Penuh)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cabang
                  </label>
                  <select
                    value={formData.branch_id}
                    onChange={(e) => setFormData({ ...formData, branch_id: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Semua / Bebas</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-3 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-[#0284C7] shrink-0 mt-0.5" />
                <p className="text-[11px] text-sky-900 leading-relaxed">
                  <strong>Kasir</strong> dapat memproses pesanan di kasir dan update status laundry.
                  <strong> Owner</strong> dapat melihat omzet, stok bahan baku, dan menambah karyawan.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-sm font-semibold rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Menyimpan...'
                    : editingUser
                    ? 'Simpan Perubahan'
                    : 'Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Hapus Akun Karyawan?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Akun <strong>{deleteTarget.name}</strong> ({deleteTarget.email}) tidak akan dapat login lagi ke sistem FreshWash.
            </p>

            <div className="mt-5 flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
