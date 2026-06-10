import { useState, useMemo } from 'react'
import { useSpaces } from '../hooks/useSpaces'

const STATUS_COLORS = {
  available: 'bg-gray-800 hover:bg-gray-700 border-gray-700 cursor-pointer',
  sold:      'border-gray-700 cursor-pointer',
  pending:   'bg-yellow-900/30 border-yellow-700/50 cursor-default',
}

const ZONES   = ['Todas', 'San Isidro', 'Miraflores', 'Barranco', 'Surco', 'La Molina']
const CATEGORIES = ['Todas', 'Restaurante', 'Boutique', 'Salud', 'Educación', 'Tecnología', 'Arte', 'Servicios']

function SpaceCell({ space, onClickAvailable, onClickOccupied }) {
  const [hovered, setHovered] = useState(false)

  const handleClick = () => {
    if (space.status === 'available') onClickAvailable(space)
    else if (space.status === 'sold') onClickOccupied(space)
  }

  const statusClass = STATUS_COLORS[space.status] ?? STATUS_COLORS.available

  return (
    <div
      className={`relative border rounded-sm transition-all duration-200 ${statusClass}`}
      style={{ aspectRatio: '1' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleClick}
      title={space.business_name ?? space.grid_position}
    >
      {space.status === 'sold' && space.image_url ? (
        <img
          src={space.image_url}
          alt={space.business_name}
          className="w-full h-full object-cover rounded-sm"
          loading="lazy"
        />
      ) : space.status === 'sold' ? (
        <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-sm">
          <span className="text-gray-400 text-[6px] font-bold truncate px-0.5">
            {space.business_name?.slice(0, 6)}
          </span>
        </div>
      ) : space.status === 'pending' ? (
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <span className="text-gray-600 text-[8px]">{space.grid_position}</span>
        </div>
      )}

      {/* Hover tooltip for sold spaces */}
      {hovered && space.status === 'sold' && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-black/90 border border-white/10 rounded-lg p-2 w-32 text-xs pointer-events-none">
          <div className="font-semibold text-white truncate">{space.business_name}</div>
          <div className="text-gray-400 truncate">{space.business_category}</div>
          <div className="text-brand-500 mt-1">Ver más →</div>
        </div>
      )}

      {/* Hover tooltip for available spaces */}
      {hovered && space.status === 'available' && (
        <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 bg-brand-500 rounded-lg px-2 py-1 text-[9px] text-white whitespace-nowrap pointer-events-none">
          + Disponible
        </div>
      )}
    </div>
  )
}

export default function Grid({ onSelectAvailable, onSelectOccupied }) {
  const [zone, setZone]         = useState('')
  const [category, setCategory] = useState('')

  const filters = useMemo(() => ({
    zone:     zone || undefined,
    category: category || undefined,
  }), [zone, category])

  const { spaces, loading } = useSpaces(filters)

  const soldCount      = spaces.filter(s => s.status === 'sold').length
  const availableCount = spaces.filter(s => s.status === 'available').length

  return (
    <section id="grid-section" className="bg-gray-950 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-white mb-2">La Grilla</h2>
          <p className="text-gray-400">
            <span className="text-brand-500 font-semibold">{soldCount}</span> espacios ocupados ·{' '}
            {availableCount <= 5 && availableCount > 0 && (
              <span className="text-red-400 font-semibold">¡Últimos {availableCount} disponibles! · </span>
            )}
            <span className="text-green-400 font-semibold">{availableCount}</span> disponibles
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          <div className="flex gap-2 flex-wrap justify-center">
            {ZONES.map(z => (
              <button
                key={z}
                onClick={() => setZone(z === 'Todas' ? '' : z)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  (z === 'Todas' && !zone) || z === zone
                    ? 'bg-brand-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {z}
              </button>
            ))}
          </div>
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-white/5 border border-white/10 text-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-brand-500"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c === 'Todas' ? '' : c} className="bg-gray-900">
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="flex gap-6 justify-center mb-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-800 border border-gray-700" /> Disponible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-600 border border-gray-600" /> Ocupado
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-yellow-900/30 border border-yellow-700/50" /> En revisión
          </span>
        </div>

        {/* Grid 20×15 */}
        {loading ? (
          <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
            {Array.from({ length: 300 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-sm bg-gray-800/50 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid gap-1 animate-fade-in" style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}>
            {spaces.map((space, i) => (
              <SpaceCell
                key={space.id ?? space.grid_position ?? i}
                space={space}
                onClickAvailable={onSelectAvailable}
                onClickOccupied={onSelectOccupied}
              />
            ))}
          </div>
        )}

        <p className="text-center text-gray-600 text-xs mt-6">
          Grilla 20×15 · 300 espacios máximo · MVP Lima
        </p>
      </div>
    </section>
  )
}
