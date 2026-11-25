import { Link, useLocation } from 'react-router-dom'
import { Calculator, ClipboardList, BarChart3, ArrowLeft, Droplets } from 'lucide-react'

const LINKS = [
  { to: '/admin/pos', label: 'Kasir (POS)', Icon: Calculator },
  { to: '/admin/orders', label: 'Status & Kurir', Icon: ClipboardList },
  { to: '/owner/dashboard', label: 'Owner Analytics', Icon: BarChart3 },
]

export default function AdminSidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-full lg:w-64 shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
      <div>
        <div className="p-4 lg:p-5 border-b border-slate-100 flex items-center justify-between lg:justify-start gap-2.5">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7] text-white flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-tight">FreshWash</p>
              <p className="text-[11px] font-medium text-slate-500">Operasional &amp; Owner</p>
            </div>
          </Link>
        </div>

        <nav className="p-3 flex lg:flex-col gap-1.5 overflow-x-auto">
          {LINKS.map(({ to, label, Icon }) => {
            const active = pathname === to
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-sky-50 text-[#0284C7] border border-sky-200/80'
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

      <div className="hidden lg:block p-4 border-t border-slate-100">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Halaman Customer
        </Link>
      </div>
    </aside>
  )
}
