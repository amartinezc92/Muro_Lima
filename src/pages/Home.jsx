import { useState } from 'react'
import Hero from '../components/Hero'
import PixelGrid from '../components/PixelGrid'
import BuyModal from '../components/BuyModal'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import { usePurchases } from '../hooks/usePurchases'

const TOTAL = 1000

export default function Home() {
  const { purchases, loading, soldPixels, reload } = usePurchases()
  const [selected, setSelected] = useState(null)

  const available = TOTAL - soldPixels

  return (
    <>
      <Hero onCTA={() => document.getElementById('muro-section')?.scrollIntoView({ behavior: 'smooth' })} />

      <section id="muro-section" className="bg-gray-950 py-14 px-4">
        <div className="max-w-4xl mx-auto">

          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-slow" />
              {available} píxeles disponibles · S/1 cada uno
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              El Muro del Millón
            </h2>
            <p className="text-gray-400 max-w-lg mx-auto">
              1,000 píxeles. Cada uno vale S/1. Haz clic en cualquier espacio libre para poner tu negocio.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <PixelGrid
              purchases={purchases}
              onSelect={({ pixelStart }) => setSelected(pixelStart)}
            />
          )}

          {/* CTA */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                const firstFree = (() => {
                  const owned = new Set()
                  for (const p of purchases) {
                    for (let i = p.pixel_start; i < p.pixel_start + p.pixel_count; i++) owned.add(i)
                  }
                  for (let i = 0; i < TOTAL; i++) if (!owned.has(i)) return i
                  return null
                })()
                if (firstFree !== null) setSelected(firstFree)
              }}
              className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/25"
            >
              Comprar mi espacio →
            </button>
            <p className="text-gray-600 text-xs mt-3">Pago único · Tu logo visible para siempre</p>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />

      {selected !== null && (
        <BuyModal
          pixelStart={selected}
          available={available}
          onClose={() => setSelected(null)}
          onSuccess={() => { setSelected(null); reload() }}
        />
      )}
    </>
  )
}
