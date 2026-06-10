import { useState, useRef, useEffect, useCallback } from 'react'

// 40 cols x 25 rows = 1000 pixels
const COLS = 40
const ROWS = 25
const TOTAL = COLS * ROWS

export default function PixelGrid({ purchases = [], onSelect }) {
  const canvasRef = useRef(null)
  const [hovered, setHovered] = useState(null)
  const [cellSize, setCellSize] = useState(20)

  // Build ownership map: pixelIndex → purchase
  const owned = {}
  for (const p of purchases) {
    if (p.status !== 'completed') continue
    for (let i = p.pixel_start; i < p.pixel_start + p.pixel_count && i < TOTAL; i++) {
      owned[i] = p
    }
  }

  const soldCount = Object.keys(owned).length
  const availableCount = TOTAL - soldCount

  // Responsive cell size
  useEffect(() => {
    function resize() {
      const container = canvasRef.current?.parentElement
      if (!container) return
      const w = container.clientWidth
      const size = Math.floor(w / COLS)
      setCellSize(Math.max(8, Math.min(size, 32)))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    canvas.width  = COLS * cellSize
    canvas.height = ROWS * cellSize

    for (let i = 0; i < TOTAL; i++) {
      const col = i % COLS
      const row = Math.floor(i / COLS)
      const x = col * cellSize
      const y = row * cellSize

      if (owned[i]) {
        ctx.fillStyle = owned[i].color || '#f97316'
        ctx.fillRect(x, y, cellSize, cellSize)
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, cellSize, cellSize)
      } else if (i === hovered) {
        ctx.fillStyle = '#f97316'
        ctx.fillRect(x, y, cellSize, cellSize)
      } else {
        ctx.fillStyle = '#1e293b'
        ctx.fillRect(x, y, cellSize, cellSize)
        ctx.strokeStyle = 'rgba(255,255,255,0.06)'
        ctx.lineWidth = 0.5
        ctx.strokeRect(x, y, cellSize, cellSize)
      }
    }
  }, [cellSize, hovered, purchases])

  function getPixelAt(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const col = Math.floor(x / cellSize)
    const row = Math.floor(y / cellSize)
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null
    return row * COLS + col
  }

  function handleMouseMove(e) {
    const idx = getPixelAt(e)
    setHovered(owned[idx] ? null : idx)
  }

  function handleClick(e) {
    const idx = getPixelAt(e)
    if (idx === null || owned[idx]) return
    onSelect?.({ pixelStart: idx, availableFrom: idx })
  }

  return (
    <div className="w-full">
      {/* Stats bar */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-gray-400">
          <span className="text-white font-bold">{soldCount}</span> vendidos
          &nbsp;·&nbsp;
          <span className="text-green-400 font-bold">{availableCount}</span> disponibles
        </span>
        <span className="text-brand-500 font-bold">S/1 por píxel</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
        <div
          className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 transition-all"
          style={{ width: `${Math.max(0.3, (soldCount / TOTAL) * 100)}%` }}
        />
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-gray-950">
        <canvas
          ref={canvasRef}
          className="block w-full cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHovered(null)}
          onClick={handleClick}
        />
        {hovered !== null && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/80 border border-white/10 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            Píxel #{hovered + 1} · Haz clic para comprar
          </div>
        )}
      </div>

      <p className="text-center text-gray-600 text-xs mt-3">
        Haz clic en cualquier píxel disponible para comprar tu espacio
      </p>
    </div>
  )
}
