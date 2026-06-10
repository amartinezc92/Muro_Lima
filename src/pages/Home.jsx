import { useState } from 'react'
import Hero from '../components/Hero'
import LimaMap, { DISTRICTS } from '../components/LimaMap'
import DistrictModal from '../components/DistrictModal'
import FAQ from '../components/FAQ'
import Footer from '../components/Footer'
import { useDistricts } from '../hooks/useDistricts'

export default function Home() {
  const { districts, list, loading, totalStats, reload } = useDistricts()
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedSpace, setSelectedSpace]       = useState(null)

  function handleSelectDistrict(districtDef, spaceRow) {
    setSelectedDistrict(districtDef)
    setSelectedSpace(spaceRow)
  }

  const totalPixels  = totalStats.totalPixels
  const soldPixels   = totalStats.soldPixels
  const pct          = totalPixels ? ((soldPixels / totalPixels) * 100).toFixed(2) : 0

  return (
    <>
      <Hero onCTA={() => document.getElementById('map-section')?.scrollIntoView({ behavior: 'smooth' })} />

      {/* Map section */}
      <section id="map-section" className="bg-gray-950 py-14 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse-slow" />
              Mapa interactivo · 20 distritos de Lima
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
              Tu negocio en el mapa de Lima
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Haz clic en cualquier distrito para comprar píxeles. Tu logo aparece visible en ese barrio.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Map */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center justify-center h-96">
                  <div className="text-center text-gray-500">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    Cargando mapa...
                  </div>
                </div>
              ) : (
                <LimaMap spaceData={districts} onSelectDistrict={handleSelectDistrict} />
              )}
            </div>

            {/* Sidebar: district list */}
            <div className="w-full lg:w-72 shrink-0">
              <h3 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Distritos disponibles</h3>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto scrollbar-hide">
                {list
                  .filter(s => s.status !== 'full')
                  .sort((a, b) => b.base_price_per_px - a.base_price_per_px)
                  .map(s => {
                    const pct = Math.round((s.sold_pixels / s.total_pixels) * 100)
                    const available = s.total_pixels - s.sold_pixels
                    return (
                      <button
                        key={s.district_slug}
                        onClick={() => {
                          const def = DISTRICTS.find(d => d.slug === s.district_slug)
                          if (def) handleSelectDistrict(def, s)
                        }}
                        className="w-full text-left bg-gray-900 hover:bg-gray-800 border border-white/5 hover:border-white/15 rounded-xl p-3 transition-all group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-white text-sm font-semibold group-hover:text-brand-400 transition-colors">
                            {s.district}
                          </span>
                          <span className="text-brand-500 text-sm font-bold">S/{s.base_price_per_px}/px</span>
                        </div>
                        <div className="w-full bg-gray-800 rounded-full h-1 mb-1.5">
                          <div className="h-1 rounded-full bg-brand-500 transition-all"
                               style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{pct}% ocupado</span>
                          <span className="text-green-500">{available.toLocaleString()} px libres</span>
                        </div>
                      </button>
                    )
                  })}
              </div>

              {/* Global progress */}
              <div className="mt-6 bg-gray-900 border border-white/10 rounded-xl p-4">
                <div className="flex justify-between text-xs text-gray-500 mb-2">
                  <span>Lima completa</span>
                  <span>{pct}% vendido</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 mb-2">
                  <div className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 transition-all"
                       style={{ width: `${Math.max(0.5, pct)}%` }} />
                </div>
                <div className="text-center">
                  <div className="text-white font-extrabold text-xl">{soldPixels.toLocaleString()}</div>
                  <div className="text-gray-600 text-xs">de {totalPixels.toLocaleString()} píxeles vendidos</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FAQ />
      <Footer />

      {selectedDistrict && (
        <DistrictModal
          district={selectedDistrict}
          spaceData={districts}
          onClose={() => { setSelectedDistrict(null); setSelectedSpace(null) }}
          onSuccess={() => { setSelectedDistrict(null); setSelectedSpace(null); reload() }}
        />
      )}
    </>
  )
}
