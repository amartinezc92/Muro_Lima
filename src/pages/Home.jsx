import { useState } from 'react'
import Hero from '../components/Hero'
import PixelCanvas from '../components/PixelCanvas'
import PixelPurchaseFlow from '../components/PixelPurchaseFlow'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import { usePixelBlocks } from '../hooks/usePixelBlocks'

export default function Home() {
  const { blocks, loading, stats, reload } = usePixelBlocks()
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [showPurchase, setShowPurchase]   = useState(false)

  function handleSelectBlock(block) {
    setSelectedBlock(block)
    setShowPurchase(true)
  }

  return (
    <>
      <Hero onCTA={() => document.getElementById('canvas-section')?.scrollIntoView({ behavior: 'smooth' })} />

      {/* Canvas section */}
      <section id="canvas-section" className="bg-gray-950 py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-white mb-2">El Muro de Lima</h2>
            <p className="text-gray-400 mb-1">
              <span className="text-brand-500 font-bold">{stats.sold.toLocaleString()}</span> de{' '}
              <span className="text-white font-bold">1,000,000</span> píxeles vendidos ·{' '}
              <span className="text-green-400 font-bold">S/1</span> por píxel
            </p>
            <p className="text-gray-600 text-sm">
              Haz zoom · Haz clic en cualquier área para comprar tus píxeles
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-96 text-gray-500">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                Cargando el Muro de Lima...
              </div>
            </div>
          ) : (
            <PixelCanvas occupiedBlocks={blocks} onSelectBlock={handleSelectBlock} />
          )}

          {/* Progress bar */}
          <div className="mt-6 max-w-2xl mx-auto">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{stats.sold.toLocaleString()} píxeles vendidos</span>
              <span>{((stats.sold / 1_000_000) * 100).toFixed(3)}% completado</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-brand-500 to-orange-400 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.max(0.3, (stats.sold / 1_000_000) * 100)}%` }}
              />
            </div>
            <p className="text-center text-gray-600 text-xs mt-2">
              {(1_000_000 - stats.sold).toLocaleString()} píxeles disponibles · Potencial total: S/1,000,000
            </p>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />

      {showPurchase && selectedBlock && (
        <PixelPurchaseFlow
          selectedBlock={selectedBlock}
          onClose={() => { setShowPurchase(false); setSelectedBlock(null) }}
          onSuccess={() => { setShowPurchase(false); setSelectedBlock(null); reload() }}
        />
      )}
    </>
  )
}
