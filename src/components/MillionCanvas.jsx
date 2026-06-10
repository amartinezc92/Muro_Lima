import { useEffect, useRef, useState, useCallback } from 'react'

const GRID = 1000
const MIN_ZOOM = 1
const MAX_ZOOM = 40

export default function MillionCanvas({ purchases = [], onSelect }) {
  const canvasRef  = useRef(null)
  const wrapRef    = useRef(null)
  const imagesRef  = useRef({})
  const stateRef   = useRef({ zoom: 1, panX: 0, panY: 0 })   // mutable, avoids stale closures
  const dragRef    = useRef(null)   // { mode: 'pan'|'select', startX, startY, ... }
  const soldMapRef = useRef({})

  const [zoom, setZoom]       = useState(1)
  const [tooltip, setTooltip] = useState(null)
  const [selBox, setSelBox]   = useState(null)   // canvas coords
  const [, forceRender]       = useState(0)

  // ── Build sold map ───────────────────────────────────────────────
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
    soldMapRef.current = m
  }, [purchases])

  // ── Draw ─────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx   = canvas.getContext('2d')
    const { zoom: z, panX, panY } = stateRef.current
    const W = canvas.width, H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.scale(z, z)
    ctx.translate(-panX, -panY)

    // Background — visible dark slate so the grid reads clearly
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(panX, panY, W / z, H / z)

    // Grid lines — always visible at base zoom, get finer as you zoom
    if (z >= 6) {
      // Per-pixel grid
      ctx.strokeStyle = 'rgba(255,255,255,0.12)'
      ctx.lineWidth = 0.5 / z
      const x0 = Math.floor(panX), y0 = Math.floor(panY)
      const x1 = panX + W / z,    y1 = panY + H / z
      for (let x = x0; x <= x1; x++) {
        ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke()
      }
      for (let y = y0; y <= y1; y++) {
        ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke()
      }
    } else {
      // 10-pixel grid — always on
      ctx.strokeStyle = 'rgba(255,255,255,0.07)'
      ctx.lineWidth = 0.5 / z
      for (let x = 0; x <= GRID; x += 10) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, GRID); ctx.stroke()
      }
      for (let y = 0; y <= GRID; y += 10) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(GRID, y); ctx.stroke()
      }
    }

    // Purchases
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
          im.onload  = () => { imagesRef.current[p.image_url] = im;   draw() }
          im.onerror = () => { imagesRef.current[p.image_url] = null; draw() }
          im.src = p.image_url
        }
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.1)'
      ctx.lineWidth = 0.5 / z
      ctx.strokeRect(p.px, p.py, p.pw, p.ph)
    }

    // Selection box
    if (selBox) {
      ctx.fillStyle = 'rgba(249,115,22,0.2)'
      ctx.fillRect(selBox.x, selBox.y, selBox.w, selBox.h)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1.5 / z
      ctx.strokeRect(selBox.x, selBox.y, selBox.w, selBox.h)

      if (selBox.w > 0 && selBox.h > 0) {
        const px = selBox.w * selBox.h
        ctx.fillStyle = '#f97316'
        ctx.font = `bold ${Math.max(8, 12 / z)}px Geist, Inter, sans-serif`
        ctx.fillText(
          `${px.toLocaleString()} px · S/${px.toLocaleString()}`,
          selBox.x + 1 / z,
          selBox.y > 20 / z ? selBox.y - 3 / z : selBox.y + selBox.h + 12 / z
        )
      }
    }

    ctx.restore()
  }, [purchases, selBox])

  useEffect(() => { draw() }, [draw])

  // ── Resize canvas to container ────────────────────────────────────
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      const wrap = wrapRef.current
      const canvas = canvasRef.current
      if (!wrap || !canvas) return
      canvas.width  = wrap.clientWidth
      canvas.height = wrap.clientWidth   // square aspect ratio for 1:1 grid
      clampPan()
      draw()
    })
    if (wrapRef.current) ro.observe(wrapRef.current)
    return () => ro.disconnect()
  }, [draw])

  // ── Helpers ───────────────────────────────────────────────────────
  function clampPan() {
    const canvas = canvasRef.current
    if (!canvas) return
    const s = stateRef.current
    const maxPanX = Math.max(0, GRID - canvas.width  / s.zoom)
    const maxPanY = Math.max(0, GRID - canvas.height / s.zoom)
    s.panX = Math.max(0, Math.min(s.panX, maxPanX))
    s.panY = Math.max(0, Math.min(s.panY, maxPanY))
  }

  function canvasPosFromEvent(e) {
    const rect = canvasRef.current.getBoundingClientRect()
    const s = stateRef.current
    const cx = (e.clientX - rect.left) * (canvasRef.current.width  / rect.width)
    const cy = (e.clientY - rect.top)  * (canvasRef.current.height / rect.height)
    return {
      x: Math.max(0, Math.min(GRID - 1, Math.floor(cx / s.zoom + s.panX))),
      y: Math.max(0, Math.min(GRID - 1, Math.floor(cy / s.zoom + s.panY))),
      cx, cy,
    }
  }

  function applyZoom(newZoom, cx, cy) {
    const s = stateRef.current
    const oldZoom = s.zoom
    newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom))
    // Keep the canvas point under cursor fixed
    s.panX = s.panX + cx / oldZoom - cx / newZoom
    s.panY = s.panY + cy / oldZoom - cy / newZoom
    s.zoom = newZoom
    clampPan()
    setZoom(newZoom)
    draw()
  }

  // ── Wheel: zoom with Ctrl/pinch, pan otherwise ───────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    function onWheel(e) {
      e.preventDefault()
      const s = stateRef.current
      if (e.ctrlKey || e.metaKey) {
        // Ctrl+scroll = zoom centered on cursor
        const rect = canvas.getBoundingClientRect()
        const cx = (e.clientX - rect.left) * (canvas.width  / rect.width)
        const cy = (e.clientY - rect.top)  * (canvas.height / rect.height)
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
        applyZoom(s.zoom * factor, cx, cy)
      } else {
        // Plain scroll = pan (when zoomed)
        if (s.zoom <= 1) return
        s.panX += e.deltaX / s.zoom
        s.panY += e.deltaY / s.zoom
        clampPan()
        setZoom(z => z) // trigger re-render
        draw()
      }
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [draw])

  // ── Mouse events ──────────────────────────────────────────────────
  function onMouseDown(e) {
    const { x, y, cx, cy } = canvasPosFromEvent(e)
    const s = stateRef.current
    dragRef.current = {
      mode: 'select',
      startX: x, startY: y,
      startCx: cx, startCy: cy,
      lastCx: cx, lastCy: cy,
    }
  }

  function onMouseMove(e) {
    const { x, y, cx, cy } = canvasPosFromEvent(e)
    const s = stateRef.current
    const d = dragRef.current

    if (d) {
      if (d.mode === 'pan') {
        const dx = (cx - d.lastCx) / s.zoom
        const dy = (cy - d.lastCy) / s.zoom
        s.panX -= dx
        s.panY -= dy
        d.lastCx = cx
        d.lastCy = cy
        clampPan()
        draw()
      } else {
        // select mode
        const sx = Math.min(d.startX, x)
        const sy = Math.min(d.startY, y)
        const sw = Math.abs(x - d.startX) + 1
        const sh = Math.abs(y - d.startY) + 1
        setSelBox({ x: sx, y: sy, w: sw, h: sh })
      }
      setTooltip(null)
      return
    }

    // Hover tooltip
    const owner = soldMapRef.current[x]?.[y]
    if (owner) {
      setTooltip({ clientX: e.clientX, clientY: e.clientY, purchase: owner })
    } else {
      setTooltip(null)
    }
  }

  function onMouseUp(e) {
    const d = dragRef.current
    dragRef.current = null
    if (!d) return

    if (d.mode === 'select' && selBox) {
      setSelBox(null)
      const { x, y } = canvasPosFromEvent(e)
      const owner = soldMapRef.current[x]?.[y]
      if (owner?.destination_link) { window.open(owner.destination_link, '_blank'); return }
      const sx = Math.min(d.startX, x)
      const sy = Math.min(d.startY, y)
      const sw = Math.abs(x - d.startX) + 1
      const sh = Math.abs(y - d.startY) + 1
      onSelect?.({ x: sx, y: sy, w: sw, h: sh, pixels: sw * sh })
    }
  }

  function onMouseLeave() {
    dragRef.current = null
    setSelBox(null)
    setTooltip(null)
  }

  // ── Zoom buttons ──────────────────────────────────────────────────
  function zoomIn()    { const c = canvasRef.current; applyZoom(stateRef.current.zoom * 2, c.width / 2, c.height / 2) }
  function zoomOut()   { const c = canvasRef.current; applyZoom(stateRef.current.zoom / 2, c.width / 2, c.height / 2) }
  function resetZoom() { stateRef.current.zoom = 1; stateRef.current.panX = 0; stateRef.current.panY = 0; setZoom(1); draw() }

  const soldPixels = purchases.reduce((s, p) => s + (p.pw ?? 0) * (p.ph ?? 0), 0)
  const pct = ((soldPixels / (GRID * GRID)) * 100).toFixed(4)
  const isPanning = zoom > 1.5

  return (
    <div className="w-full select-none">

      {/* Canvas wrapper */}
      <div ref={wrapRef} className="relative w-full rounded-xl overflow-hidden border border-zinc-900 bg-[#09090b]">
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', imageRendering: 'pixelated', cursor: 'crosshair' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        />

        {/* Zoom controls */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-zinc-950/90 border border-zinc-800 rounded-lg p-1 backdrop-blur">
          <button onClick={zoomOut} disabled={zoom <= 1}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none">
            −
          </button>
          <button onClick={resetZoom}
            className="px-2 h-7 text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all tabular-nums min-w-[42px] text-center">
            {zoom < 10 ? zoom.toFixed(1) : Math.round(zoom)}×
          </button>
          <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM}
            className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed text-lg leading-none">
            +
          </button>
        </div>

        {/* Mode hint */}
        <div className="absolute bottom-3 left-3 text-zinc-700 text-xs pointer-events-none">
          {zoom > 1 ? 'arrastra para seleccionar · scroll para mover' : 'arrastra para seleccionar · Ctrl+scroll para zoom'}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className="fixed z-50 pointer-events-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 shadow-2xl text-sm"
             style={{ left: tooltip.clientX + 14, top: tooltip.clientY - 8, maxWidth: 200 }}>
          <p className="font-semibold text-white text-xs">{tooltip.purchase.business_name}</p>
          {tooltip.purchase.destination_link && <p className="text-orange-500 text-xs mt-0.5">clic para visitar →</p>}
        </div>
      )}
    </div>
  )
}
