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

  const pct = ((soldPixels / TOTAL) * 100).toFixed(2)

  return (
    <>
      <Hero onCTA={() => document.getElementById('muro-section')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="muro-section" className="bg-gray-950 py-14 px-4">
        <div className="max-w-5xl mx-auto">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-slow" />
              {(TOTAL - soldPixels).toLocaleString()} píxeles disponibles · S/1 cada uno
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              El Muro del Millón
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              1,000,000 píxeles. Cada píxel vale S/1. Compra tu espacio, sube tu logo y queda visible para siempre.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <MillionCanvas
              purchases={purchases}
              onSelect={sel => setSelection(sel)}
            />
          )}

          <div className="mt-8 text-center">
            <button
              onClick={() => setSelection({ x: 0, y: 0, w: 10, h: 10, pixels: 100 })}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/25"
            >
              Comprar mi espacio →
            </button>
            <p className="text-gray-600 text-xs mt-3">
              Arrastra en el muro para elegir tu espacio · S/1 por píxel
            </p>
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
    </>
  )
}
