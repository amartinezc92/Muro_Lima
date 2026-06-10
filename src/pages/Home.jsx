import { useState } from 'react'
import Hero from '../components/Hero'
import MillionCanvas from '../components/MillionCanvas'
import BuyModal from '../components/BuyModal'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import { usePurchases } from '../hooks/usePurchases'

const TOTAL = 1_000_000

export default function Home() {
  const { purchases, loading, soldPixels, reload } = usePurchases()
  const [selection, setSelection] = useState(null)

  const available = (TOTAL - soldPixels).toLocaleString()
  const pct = ((soldPixels / TOTAL) * 100).toFixed(4)

  return (
    <div className="bg-[#09090b]">
      <Hero onCTA={() => document.getElementById('muro-section')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="muro-section" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">

          {/* Section header */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">El Muro</h2>
              <span className="text-zinc-500 text-sm tabular-nums">
                {available} px disponibles
              </span>
            </div>
            {/* Progress bar */}
            <div className="relative h-1 bg-zinc-900 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(0.1, parseFloat(pct))}%` }}
              />
            </div>
            <div className="flex justify-between mt-1.5">
              <span className="text-zinc-700 text-xs">{soldPixels.toLocaleString()} vendidos</span>
              <span className="text-zinc-700 text-xs">{pct}% ocupado</span>
            </div>
          </div>

          {/* Canvas */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-5 h-5 border border-zinc-700 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : (
            <MillionCanvas purchases={purchases} onSelect={setSelection} />
          )}

          {/* Instruction */}
          <p className="text-center text-zinc-700 text-xs mt-5 tracking-wide">
            Arrastra sobre el muro para seleccionar tu espacio · S/1 por píxel
          </p>

          {/* CTA */}
          <div className="flex justify-center mt-8">
            <button
              onClick={() => setSelection({ x: 0, y: 0, w: 10, h: 10, pixels: 100 })}
              className="group bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-medium px-6 py-3 rounded-xl text-sm transition-all"
            >
              Comprar sin seleccionar
              <span className="ml-1.5 text-zinc-600 group-hover:text-zinc-400 transition-colors">→</span>
            </button>
          </div>

        </div>
      </section>

      <FAQ />
      <Footer />

      {selection && (
        <BuyModal
          selection={selection}
          onClose={() => setSelection(null)}
          onSuccess={() => { setSelection(null); reload() }}
        />
      )}
    </div>
  )
}
