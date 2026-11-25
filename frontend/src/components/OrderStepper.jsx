import { Check, Truck, Waves, Shirt, PackageCheck, Sparkles } from 'lucide-react'

const STEPS = [
  { key: 'dijemput', label: 'Dijemput', desc: 'Kurir menjemput cucian', Icon: Truck },
  { key: 'dicuci', label: 'Dicuci', desc: '1 mesin 1 klien', Icon: Waves },
  { key: 'disetrika', label: 'Disetrika', desc: 'Setrika uap & lipat rapi', Icon: Shirt },
  { key: 'siap_diantar', label: 'Siap Diantar', desc: 'Menunggu kurir / ambil', Icon: PackageCheck },
  { key: 'selesai', label: 'Selesai', desc: 'Cucian diterima bersih', Icon: Sparkles },
]

export default function OrderStepper({ currentStatus = 'disetrika' }) {
  const activeIdx = Math.max(
    0,
    STEPS.findIndex((s) => s.key === currentStatus)
  )

  return (
    <div className="relative w-full py-2">
      {/* Connector background line (desktop) */}
      <div className="hidden md:block absolute top-7 left-10 right-10 h-1 bg-slate-200 rounded-full z-0" />
      <div
        className="hidden md:block absolute top-7 left-10 h-1 bg-[#0284C7] rounded-full z-0 transition-all duration-500"
        style={{
          width: activeIdx === 0 ? '0%' : `calc(${(activeIdx / (STEPS.length - 1)) * 100}% - 2.5rem)`,
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
        {STEPS.map((step, idx) => {
          const isCompleted = idx < activeIdx || (currentStatus === 'selesai' && idx === activeIdx)
          const isActive = idx === activeIdx && currentStatus !== 'selesai'
          const StepIcon = step.Icon

          return (
            <div key={step.key} className="flex md:flex-col items-center md:text-center gap-3 md:gap-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                  isCompleted
                    ? 'bg-[#10B981] text-white shadow-sm'
                    : isActive
                    ? 'bg-[#0284C7] text-white ring-4 ring-sky-200 animate-pulse shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
              </div>
              <div>
                <p
                  className={`text-sm font-semibold ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isActive
                      ? 'text-[#0284C7]'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 hidden sm:block">{step.desc}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
