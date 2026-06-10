import { useEffect } from 'react'
import { incrementSpaceClick } from '../services/database'

export default function SpaceModal({ space, onClose, onBuy }) {
  useEffect(() => {
    if (space?.id) incrementSpaceClick(space.id).catch(() => {})
  }, [space?.id])

  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  if (!space) return null

  const isOccupied = space.status === 'sold'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl">✕</button>

        {isOccupied ? (
          <>
            {space.image_url && (
              <img src={space.image_url} alt={space.business_name}
                   className="w-full h-40 object-cover rounded-xl mb-4" />
            )}
            <div className="inline-block bg-green-900/30 text-green-400 text-xs px-2 py-0.5 rounded-full mb-2">
              {space.business_category}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{space.business_name}</h3>
            {space.description && (
              <p className="text-gray-400 text-sm mb-4">{space.description}</p>
            )}
            <div className="text-gray-600 text-xs mb-4">Posición: {space.grid_position} · Zona: {space.zone}</div>
            {space.destination_link && (
              <a
                href={space.destination_link}
                target="_blank"
                rel="noreferrer"
                className="block w-full bg-brand-500 hover:bg-brand-600 text-white text-center font-semibold py-3 rounded-xl transition-colors"
              >
                Visitar negocio →
              </a>
            )}
          </>
        ) : (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-2xl">✨</div>
              <h3 className="text-xl font-bold text-white mb-1">¡Espacio disponible!</h3>
              <p className="text-gray-400 text-sm">Posición <span className="text-white font-mono">{space.grid_position}</span></p>
            </div>
            <p className="text-gray-400 text-sm text-center mb-6">
              Este espacio puede ser tuyo. Miles de personas de Lima verán tu negocio aquí.
            </p>
            <button
              onClick={() => { onClose(); onBuy(space) }}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-brand-500/30"
            >
              Comprar este espacio
            </button>
            <button onClick={onClose} className="w-full text-gray-500 hover:text-gray-300 text-sm mt-3 transition-colors">
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  )
}
