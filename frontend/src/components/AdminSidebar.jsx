import { Link, useLocation } from 'react-router-dom'
import { Calculator, ClipboardList, BarChart3, Users, Tag, ArrowLeft, Droplets, Shield, Store, LogOut } from 'lucide-react'
import { getStoredUser, clearAuthSession } from '../lib/api'

export default function AdminSidebar() {
  const { pathname } = useLocation()
  const user = getStoredUser()
  const isOwner = user?.role === 'owner'
  const isKasir = user?.role === 'kasir'

  // Kasir HANYA mendapatkan menu POS Kasir & Pengantaran
  // Owner mendapatkan SEMUA menu tracking, analitik, promo, karyawan, dan kasir
  const links = isKasir
    ? [
        { to: '/admin/pos', label: 'Kasir & Pengantaran (POS)', Icon: Calculator },
      ]
    : [
        { to: '/owner/dashboard', label: 'Owner Analytics & Omzet', Icon: BarChart3 },
        { to: '/admin/orders', label: 'Tracking & Status Pesanan', Icon: ClipboardList },
        { to: '/owner/promos', label: 'Kelola Kode Promo', Icon: Tag },
        { to: '/owner/users', label: 'Kelola Karyawan', Icon: Users },
        { to: '/admin/pos', label: 'Kasir (POS)', Icon: Calculator },
      ]

  const handleLogout = () => {
    clearAuthSession()
    window.location.href = '/login'
  }

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
      <div>
        <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">FreshWash</p>
              <p className="text-[11px] font-medium text-slate-500">
                {isKasir ? 'Panel Kasir Toko' : 'Panel Manajemen Owner'}
              </p>
            </div>
          </Link>
        </div>

        {/* Badge Info Role Login Aktif */}
        <div
          className={`p-3 mx-3 mt-3 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
            isKasir
              ? 'bg-sky-50 text-[#0284C7] border-sky-200'
              : 'bg-purple-50 text-purple-700 border-purple-200'
          }`}
        >
          {isKasir ? (
            <Store className="w-4 h-4 text-sky-600 shrink-0" />
          ) : (
            <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-bold truncate text-slate-900">{user?.name || 'Pengguna'}</p>
            <p className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
              {isKasir ? 'Role: Kasir (Akses POS Saja)' : 'Role: Owner (Akses Penuh)'}
            </p>
          </div>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
          {links.map(({ to, label, Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-sky-50 text-[#0284C7] border border-sky-200/80 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-slate-100 space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Halaman Utama Customer
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Keluar (Logout)
        </button>
      </div>
    </aside>
  )
}
