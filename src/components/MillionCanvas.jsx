import { useEffect, useRef, useState, useCallback } from 'react'

const GRID = 1000       // 1000x1000 pixels

export default function MillionCanvas({ purchases = [], onSelect }) {
  const canvasRef   = useRef(null)
  const imagesRef   = useRef({})   // cache loaded images
  const [scale, setScale]     = useState(1)
  const [tooltip, setTooltip] = useState(null)
  const [hover, setHover]     = useState(null)   // {x,y,w,h} snapped block

  // Build sold map for hit-testing: cells[x][y] = purchase
  const soldMap = useRef({})
  useEffect(() => {
    const m = {}
    for (const p of purchases) {
      for (let x = p.px; x < p.px + p.pw; x++) {
        for (let y = p.py; y < p.py + p.ph; y++) {
          if (!m[x]) m[x] = {}
          m[x][y] = p
        }
      }
    }
    soldMap.current = m
  }, [purchases])

  // Responsive scale
  useEffect(() => {
    function resize() {
      const w = canvasRef.current?.parentElement?.clientWidth || 800
      setScale(Math.min(1, w / GRID))
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Draw everything
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, GRID, GRID)

    // Grid lines (very subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= GRID; x += 10) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GRID); ctx.stroke()
    }
    for (let y = 0; y <= GRID; y += 10) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GRID, y); ctx.stroke()
    }

    // Draw purchased blocks
    for (const p of purchases) {
      if (p.image_url && imagesRef.current[p.image_url]) {
        ctx.drawImage(imagesRef.current[p.image_url], p.px, p.py, p.pw, p.ph)
      } else {
        ctx.fillStyle = p.color || '#f97316'
        ctx.fillRect(p.px, p.py, p.pw, p.ph)
        // Load image async
        if (p.image_url && !imagesRef.current[p.image_url]) {
          imagesRef.current[p.image_url] = 'loading'
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.onload = () => {
            imagesRef.current[p.image_url] = img
            // trigger redraw via state
            setScale(s => s) // force re-render
          }
          img.src = p.image_url
        }
      }
      // Border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 0.5
      ctx.strokeRect(p.px, p.py, p.pw, p.ph)
    }

    // Hover highlight
    if (hover) {
      ctx.fillStyle = 'rgba(249,115,22,0.35)'
      ctx.fillRect(hover.x, hover.y, hover.w, hover.h)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1.5
      ctx.strokeRect(hover.x, hover.y, hover.w, hover.h)
    }
  }, [purchases, hover, scale])

  function getCanvasPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.floor((e.clientX - rect.left) / scale)
    const y = Math.floor((e.clientY - rect.top)  / scale)
    return { x: Math.max(0, Math.min(GRID - 1, x)), y: Math.max(0, Math.min(GRID - 1, y)) }
  }

  function snapToGrid(x, y) {
    return { x, y, w: 1, h: 1 }
  }

  function getOwnerAt(x, y) {
    return soldMap.current[x]?.[y] ?? null
  }

  function handleMouseMove(e) {
    const { x, y } = getCanvasPos(e)
    const owner = getOwnerAt(x, y)

    if (owner) {
      setHover(null)
      setTooltip({ x: e.clientX, y: e.clientY, purchase: owner })
    } else {
      const snapped = snapToGrid(x, y)
      setHover(snapped)
      setTooltip(null)
    }
  }

  function handleMouseLeave() {
    setHover(null)
    setTooltip(null)
  }

  function handleClick(e) {
    const { x, y } = getCanvasPos(e)
    const owner = getOwnerAt(x, y)
    if (owner) {
      if (owner.destination_link) window.open(owner.destination_link, '_blank')
      return
    }
    const snapped = snapToGrid(x, y)
    onSelect?.(snapped)
  }

  const soldPixels = purchases.reduce((s, p) => s + p.pw * p.ph, 0)
  const pct = ((soldPixels / (GRID * GRID)) * 100).toFixed(2)

  return (
    <div className="w-full">
      {/* Stats */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-gray-400">
          <span className="text-white font-bold">{soldPixels.toLocaleString()}</span> vendidos
          &nbsp;·&nbsp;
          <span className="text-green-400 font-bold">{(GRID * GRID - soldPixels).toLocaleString()}</span> disponibles
        </span>
        <span className="text-brand-500 font-bold">{pct}% ocupado</span>
      </div>

      {/* Progress */}
      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 transition-all"
             style={{ width: `${Math.max(0.1, parseFloat(pct))}%` }} />
      </div>

      {/* Canvas wrapper */}
      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={GRID}
          height={GRID}
          style={{ width: '100%', imageRendering: 'pixelated', cursor: hover ? 'crosshair' : 'pointer', display: 'block' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {hover && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/85 border border-white/10 text-white text-xs px-3 py-1.5 rounded-full pointer-events-none whitespace-nowrap">
            ({hover.x}, {hover.y}) — Haz clic para comprar píxeles aquí
          </div>
        )}
      </div>

      {/* Tooltip for purchased blocks */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none bg-gray-900 border border-white/15 rounded-xl p-3 shadow-2xl text-sm"
             style={{ left: tooltip.x + 16, top: tooltip.y - 10, maxWidth: 220 }}>
          <div className="font-bold text-white mb-0.5">{tooltip.purchase.business_name}</div>
          {tooltip.purchase.destination_link && (
            <div className="text-brand-500 text-xs">Clic para visitar →</div>
          )}
        </div>
      )}

      <p className="text-center text-gray-600 text-xs mt-3">
        Desde 1 píxel (S/1) · Haz clic en cualquier espacio libre para comprar
      </p>
    </div>
  )
}
