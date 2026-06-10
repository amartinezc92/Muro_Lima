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
