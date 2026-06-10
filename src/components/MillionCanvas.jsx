import { useEffect, useRef, useState } from 'react'

const GRID = 1000

export default function MillionCanvas({ purchases = [], onSelect }) {
  const canvasRef = useRef(null)
  const imagesRef = useRef({})
  const [scale, setScale] = useState(1)
  const [tooltip, setTooltip] = useState(null)
  const [drag, setDrag] = useState(null)     // { startX, startY, endX, endY }
  const [isDragging, setIsDragging] = useState(false)

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

  // Sold map for hit-testing
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

  // Draw
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, GRID, GRID)

    // Subtle grid every 10px
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 0.5
    for (let i = 0; i <= GRID; i += 10) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, GRID); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(GRID, i); ctx.stroke()
    }

    // Purchased blocks
    for (const p of purchases) {
      const img = imagesRef.current[p.image_url]
      if (img && img !== 'loading') {
        ctx.drawImage(img, p.px, p.py, p.pw, p.ph)
      } else {
        ctx.fillStyle = p.color || '#f97316'
        ctx.fillRect(p.px, p.py, p.pw, p.ph)
        if (p.image_url && !imagesRef.current[p.image_url]) {
          imagesRef.current[p.image_url] = 'loading'
          const im = new Image()
          im.crossOrigin = 'anonymous'
          im.onload = () => { imagesRef.current[p.image_url] = im; setScale(s => s) }
          im.src = p.image_url
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 0.5
      ctx.strokeRect(p.px, p.py, p.pw, p.ph)
    }

    // Drag selection
    if (drag) {
      const x = Math.min(drag.startX, drag.endX)
      const y = Math.min(drag.startY, drag.endY)
      const w = Math.abs(drag.endX - drag.startX) + 1
      const h = Math.abs(drag.endY - drag.startY) + 1
      ctx.fillStyle = 'rgba(249,115,22,0.25)'
      ctx.fillRect(x, y, w, h)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1.5
      ctx.strokeRect(x, y, w, h)

      // Label
      const px = w * h
      ctx.fillStyle = '#f97316'
      ctx.font = 'bold 12px Inter, sans-serif'
      ctx.fillText(`${px.toLocaleString()} px · S/${px.toLocaleString()}`, x + 2, y - 4 > 14 ? y - 4 : y + h + 14)
    }
  }, [purchases, drag, scale])

  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(GRID - 1, Math.floor((e.clientX - rect.left) / scale)))
    const y = Math.max(0, Math.min(GRID - 1, Math.floor((e.clientY - rect.top) / scale)))
    return { x, y }
  }

  function handleMouseDown(e) {
    const { x, y } = getPos(e)
    setDrag({ startX: x, startY: y, endX: x, endY: y })
    setIsDragging(true)
    setTooltip(null)
  }

  function handleMouseMove(e) {
    const { x, y } = getPos(e)

    if (isDragging && drag) {
      setDrag(d => ({ ...d, endX: x, endY: y }))
      return
    }

    // Tooltip for purchased blocks
    const owner = soldMap.current[x]?.[y]
    if (owner) {
      setTooltip({ clientX: e.clientX, clientY: e.clientY, purchase: owner })
    } else {
      setTooltip(null)
    }
  }

  function handleMouseUp(e) {
    if (!isDragging || !drag) return
    setIsDragging(false)

    const x = Math.min(drag.startX, drag.endX)
    const y = Math.min(drag.startY, drag.endY)
    const w = Math.abs(drag.endX - drag.startX) + 1
    const h = Math.abs(drag.endY - drag.startY) + 1

    setDrag(null)

    // Check if clicking on a sold block
    const { x: cx, y: cy } = getPos(e)
    const owner = soldMap.current[cx]?.[cy]
    if (owner) {
      if (owner.destination_link) window.open(owner.destination_link, '_blank')
      return
    }

    onSelect?.({ x, y, w, h, pixels: w * h })
  }

  function handleMouseLeave() {
    if (isDragging && drag) {
      setIsDragging(false)
      setDrag(null)
    }
    setTooltip(null)
  }

  const soldPixels = purchases.reduce((s, p) => s + (p.pw ?? 0) * (p.ph ?? 0), 0)
  const pct = ((soldPixels / (GRID * GRID)) * 100).toFixed(2)

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 text-sm">
        <span className="text-gray-400">
          <span className="text-white font-bold">{soldPixels.toLocaleString()}</span> vendidos
          &nbsp;·&nbsp;
          <span className="text-green-400 font-bold">{(GRID * GRID - soldPixels).toLocaleString()}</span> disponibles
        </span>
        <span className="text-brand-500 font-bold">{pct}% ocupado</span>
      </div>

      <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4">
        <div className="h-1.5 rounded-full bg-gradient-to-r from-brand-500 to-orange-400 transition-all"
             style={{ width: `${Math.max(0.1, parseFloat(pct))}%` }} />
      </div>

      <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl">
        <canvas
          ref={canvasRef}
          width={GRID}
          height={GRID}
          style={{ width: '100%', imageRendering: 'pixelated', display: 'block',
                   cursor: isDragging ? 'crosshair' : 'crosshair' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
        />
      </div>

      <p className="text-center text-gray-500 text-xs mt-3">
        Arrastra para seleccionar los píxeles que quieras · S/1 por píxel
      </p>

      {tooltip && (
        <div className="fixed z-50 pointer-events-none bg-gray-900 border border-white/15 rounded-xl p-3 shadow-2xl text-sm"
             style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 10, maxWidth: 200 }}>
          <div className="font-bold text-white">{tooltip.purchase.business_name}</div>
          {tooltip.purchase.destination_link && <div className="text-brand-500 text-xs mt-0.5">Clic para visitar →</div>}
        </div>
      )}
    </div>
  )
}
