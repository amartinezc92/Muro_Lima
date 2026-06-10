import { useRef, useEffect, useState, useCallback } from 'react'

// Canvas dimensions
const CANVAS_W = 1000
const CANVAS_H = 1000
const BLOCK    = 10   // minimum purchasable block size in pixels

// Lima skyline as SVG path rendered onto the canvas background
const LIMA_SKYLINE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="100%" stop-color="#1e3a5f"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#f97316" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#f97316" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Sky background -->
  <rect width="1000" height="1000" fill="url(#sky)"/>

  <!-- Stars -->
  ${Array.from({length:80}, (_,i) => {
    const x = (i * 127 + 43) % 1000
    const y = (i * 83 + 17) % 400
    const r = i % 3 === 0 ? 1.5 : 1
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="white" opacity="${0.3 + (i%5)*0.1}"/>`
  }).join('')}

  <!-- Moon -->
  <circle cx="820" cy="80" r="28" fill="#fef3c7" opacity="0.9"/>
  <circle cx="834" cy="72" r="22" fill="#1e3a5f"/>

  <!-- Ocean / Pacific -->
  <rect x="0" y="820" width="1000" height="180" fill="#0c2d48" opacity="0.8"/>
  <path d="M0 830 Q100 820 200 835 Q300 850 400 830 Q500 810 600 828 Q700 845 800 825 Q900 810 1000 830 L1000 1000 L0 1000Z" fill="#0a2540" opacity="0.9"/>

  <!-- Waves -->
  <path d="M0 860 Q60 850 120 862 Q180 874 240 860 Q300 846 360 860 Q420 874 480 862 Q540 850 600 862 Q660 874 720 860 Q780 846 840 860 Q900 874 960 860 Q980 854 1000 860" stroke="#1a4a6e" stroke-width="2" fill="none" opacity="0.6"/>
  <path d="M0 880 Q80 868 160 882 Q240 896 320 880 Q400 864 480 880 Q560 896 640 882 Q720 868 800 882 Q880 896 960 882 Q980 878 1000 880" stroke="#1a4a6e" stroke-width="1.5" fill="none" opacity="0.4"/>

  <!-- Lima Skyline silhouette - left hills (Miraflores cliffs) -->
  <path d="M0 750 L0 700 Q20 680 40 660 Q60 640 80 650 Q100 660 120 640 Q140 620 160 630 Q180 640 200 620 Q220 600 240 610 Q260 620 280 600 Q300 580 320 590 L320 750Z" fill="#0f1e30" opacity="0.95"/>

  <!-- Central Lima buildings -->
  <path d="M300 750 L300 500 L320 500 L320 480 L340 480 L340 460 L360 460 L360 480 L380 480 L380 500 L400 500 L400 750Z" fill="#111827"/>
  <path d="M390 750 L390 520 L410 520 L410 510 L420 510 L420 490 L440 490 L440 510 L450 510 L450 520 L470 520 L470 750Z" fill="#0f172a"/>
  <path d="M460 750 L460 540 L480 540 L480 530 L490 510 L500 530 L510 540 L530 540 L530 750Z" fill="#111827"/>

  <!-- Gran Torre Lima (tallest) -->
  <path d="M520 750 L520 380 L525 380 L525 360 L530 360 L530 340 L535 320 L540 340 L540 360 L545 360 L545 380 L550 380 L550 750Z" fill="#0d1520"/>
  <rect x="522" y="375" width="26" height="3" fill="#f97316" opacity="0.4"/>
  <circle cx="535" cy="318" r="3" fill="#f97316" opacity="0.8"/>

  <!-- More buildings right -->
  <path d="M545 750 L545 560 L560 560 L560 545 L575 545 L575 560 L590 560 L590 750Z" fill="#111827"/>
  <path d="M580 750 L580 500 L595 500 L595 485 L605 485 L605 470 L615 470 L615 485 L625 485 L625 500 L640 500 L640 750Z" fill="#0f1e30"/>
  <path d="M630 750 L630 540 L645 540 L645 525 L660 525 L660 540 L675 540 L675 750Z" fill="#111827"/>
  <path d="M665 750 L665 560 L675 560 L675 545 L685 545 L685 560 L700 560 L700 750Z" fill="#0f172a"/>

  <!-- Costa Verde coastline hills -->
  <path d="M680 750 L680 640 Q700 620 720 630 Q740 640 760 620 Q780 600 800 615 Q820 630 840 610 Q860 590 880 600 Q900 610 920 590 Q940 570 960 580 Q980 590 1000 570 L1000 750Z" fill="#0f1e30" opacity="0.95"/>

  <!-- Building windows (lit up) -->
  <g fill="#fbbf24" opacity="0.6">
    <rect x="305" y="510" width="4" height="4"/>  <rect x="315" y="510" width="4" height="4"/>
    <rect x="305" y="525" width="4" height="4"/>  <rect x="315" y="530" width="4" height="4"/>
    <rect x="305" y="540" width="4" height="4"/>
    <rect x="395" y="535" width="4" height="4"/>  <rect x="405" y="530" width="4" height="4"/>
    <rect x="395" y="550" width="4" height="4"/>  <rect x="405" y="548" width="4" height="4"/>
    <rect x="550" y="570" width="4" height="4"/>  <rect x="560" y="565" width="4" height="4"/>
    <rect x="550" y="585" width="4" height="4"/>  <rect x="560" y="580" width="4" height="4"/>
    <rect x="585" y="515" width="4" height="4"/>  <rect x="595" y="510" width="4" height="4"/>
    <rect x="610" y="480" width="4" height="4"/>  <rect x="620" y="488" width="4" height="4"/>
    <rect x="585" y="530" width="4" height="4"/>  <rect x="595" y="528" width="4" height="4"/>
    <rect x="635" y="555" width="4" height="4"/>  <rect x="648" y="550" width="4" height="4"/>
    <rect x="670" y="570" width="4" height="4"/>  <rect x="680" y="565" width="4" height="4"/>
  </g>

  <!-- Brand glow at horizon -->
  <rect x="0" y="610" width="1000" height="60" fill="url(#glow)"/>

  <!-- "LIMA" text watermark -->
  <text x="500" y="790" text-anchor="middle" font-family="Arial Black, sans-serif"
        font-size="120" font-weight="900" fill="white" opacity="0.04" letter-spacing="20">
    LIMA
  </text>
</svg>`

function svgToDataUrl(svg) {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}

// Convert screen coords to canvas pixel coords
function screenToCanvas(sx, sy, pan, zoom) {
  return {
    x: Math.floor((sx - pan.x) / zoom),
    y: Math.floor((sy - pan.y) / zoom),
  }
}

// Snap to block grid
function snapToBlock(x, y) {
  return {
    bx: Math.floor(x / BLOCK) * BLOCK,
    by: Math.floor(y / BLOCK) * BLOCK,
  }
}

export default function PixelCanvas({ occupiedBlocks = [], onSelectBlock }) {
  const canvasRef  = useRef()
  const bgRef      = useRef(null)   // Lima skyline image
  const [zoom, setZoom]     = useState(0.5)
  const [pan, setPan]       = useState({ x: 0, y: 0 })
  const [hover, setHover]   = useState(null)   // { bx, by } block coords
  const [selected, setSelected] = useState(null)
  const dragging = useRef(false)
  const lastMouse = useRef({ x: 0, y: 0 })

  // Load Lima skyline background
  useEffect(() => {
    const img = new Image()
    img.src = svgToDataUrl(LIMA_SKYLINE_SVG)
    img.onload = () => { bgRef.current = img; draw() }
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.save()
    ctx.translate(pan.x, pan.y)
    ctx.scale(zoom, zoom)

    // Background fill
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Lima skyline
    if (bgRef.current) {
      ctx.globalAlpha = 0.85
      ctx.drawImage(bgRef.current, 0, 0, CANVAS_W, CANVAS_H)
      ctx.globalAlpha = 1
    }

    // Grid overlay (only draw when zoomed in enough)
    if (zoom > 0.3) {
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 0.5 / zoom
      for (let x = 0; x <= CANVAS_W; x += BLOCK) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke()
      }
      for (let y = 0; y <= CANVAS_H; y += BLOCK) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke()
      }
    }

    // Occupied blocks
    occupiedBlocks.forEach(b => {
      if (b.image) {
        ctx.drawImage(b.image, b.x, b.y, b.w, b.h)
      } else {
        ctx.fillStyle = b.color ?? '#f97316'
        ctx.globalAlpha = 0.8
        ctx.fillRect(b.x, b.y, b.w, b.h)
        ctx.globalAlpha = 1
      }
      // Subtle border
      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 0.5 / zoom
      ctx.strokeRect(b.x, b.y, b.w, b.h)
    })

    // Hover highlight
    if (hover) {
      ctx.fillStyle = 'rgba(249,115,22,0.3)'
      ctx.fillRect(hover.bx, hover.by, BLOCK, BLOCK)
      ctx.strokeStyle = '#f97316'
      ctx.lineWidth = 1 / zoom
      ctx.strokeRect(hover.bx, hover.by, BLOCK, BLOCK)
    }

    // Selected block
    if (selected) {
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2 / zoom
      ctx.setLineDash([4 / zoom, 4 / zoom])
      ctx.strokeRect(selected.bx - 1, selected.by - 1, BLOCK + 2, BLOCK + 2)
      ctx.setLineDash([])
    }

    ctx.restore()

    // Pixel counter overlay
    const sold = occupiedBlocks.reduce((s, b) => s + b.w * b.h, 0)
    const pct  = ((sold / 1_000_000) * 100).toFixed(2)
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(8, 8, 220, 36)
    ctx.fillStyle = '#f97316'
    ctx.font = 'bold 13px Inter, sans-serif'
    ctx.fillText(`${sold.toLocaleString()} / 1,000,000 px vendidos (${pct}%)`, 16, 31)
  }, [zoom, pan, hover, selected, occupiedBlocks])

  useEffect(() => { draw() }, [draw])

  // ── Mouse events ─────────────────────────────────────────────────────────

  const getRect = () => canvasRef.current?.getBoundingClientRect()

  function onMouseDown(e) {
    if (e.button !== 0) return
    dragging.current = false
    lastMouse.current = { x: e.clientX, y: e.clientY }
    canvasRef.current.addEventListener('mousemove', onDragMove)
    canvasRef.current.addEventListener('mouseup', onMouseUp)
  }

  function onDragMove(e) {
    const dx = e.clientX - lastMouse.current.x
    const dy = e.clientY - lastMouse.current.y
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragging.current = true
    setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    lastMouse.current = { x: e.clientX, y: e.clientY }
  }

  function onMouseUp(e) {
    canvasRef.current?.removeEventListener('mousemove', onDragMove)
    canvasRef.current?.removeEventListener('mouseup', onMouseUp)
    if (!dragging.current) {
      const rect = getRect()
      const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, pan, zoom)
      if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) return
      const { bx, by } = snapToBlock(x, y)
      const isOccupied = occupiedBlocks.some(b => bx >= b.x && bx < b.x + b.w && by >= b.y && by < b.y + b.h)
      if (!isOccupied) {
        setSelected({ bx, by })
        onSelectBlock?.({ bx, by, px: bx, py: by })
      }
    }
  }

  function onMouseMove(e) {
    const rect = getRect()
    const { x, y } = screenToCanvas(e.clientX - rect.left, e.clientY - rect.top, pan, zoom)
    if (x < 0 || y < 0 || x >= CANVAS_W || y >= CANVAS_H) { setHover(null); return }
    const { bx, by } = snapToBlock(x, y)
    setHover(h => (h?.bx === bx && h?.by === by) ? h : { bx, by })
  }

  function onWheel(e) {
    e.preventDefault()
    const rect   = getRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const delta  = e.deltaY > 0 ? 0.85 : 1.18
    setZoom(z => {
      const nz = Math.min(8, Math.max(0.15, z * delta))
      setPan(p => ({
        x: mouseX - (mouseX - p.x) * (nz / z),
        y: mouseY - (mouseY - p.y) * (nz / z),
      }))
      return nz
    })
  }

  // Touch support
  const lastTouchDist = useRef(null)
  function onTouchStart(e) {
    if (e.touches.length === 2) {
      lastTouchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
    } else {
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      dragging.current = false
    }
  }
  function onTouchMove(e) {
    e.preventDefault()
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const delta = dist / lastTouchDist.current
      lastTouchDist.current = dist
      setZoom(z => Math.min(8, Math.max(0.15, z * delta)))
    } else {
      const dx = e.touches[0].clientX - lastMouse.current.x
      const dy = e.touches[0].clientY - lastMouse.current.y
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragging.current = true
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
      lastMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
  }

  function resetView() {
    setZoom(0.5)
    setPan({ x: 0, y: 0 })
    setSelected(null)
  }

  const canvasSize = Math.min(window.innerWidth - 32, 900)

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        className="rounded-xl cursor-crosshair border border-white/10 shadow-2xl"
        style={{ display: 'block', margin: '0 auto', touchAction: 'none' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHover(null)}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
      />

      {/* Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        <button onClick={() => setZoom(z => Math.min(8, z * 1.4))}
                className="w-8 h-8 bg-black/70 border border-white/20 text-white rounded-lg text-lg hover:bg-black/90 flex items-center justify-center">+</button>
        <button onClick={() => setZoom(z => Math.max(0.15, z / 1.4))}
                className="w-8 h-8 bg-black/70 border border-white/20 text-white rounded-lg text-lg hover:bg-black/90 flex items-center justify-center">−</button>
        <button onClick={resetView}
                className="w-8 h-8 bg-black/70 border border-white/20 text-white rounded-lg text-xs hover:bg-black/90 flex items-center justify-center" title="Reset">⊙</button>
      </div>

      {/* Zoom level */}
      <div className="absolute bottom-3 right-3 bg-black/60 text-gray-400 text-xs px-2 py-1 rounded-lg">
        {Math.round(zoom * 100)}% · Rueda = zoom · Drag = mover
      </div>

      {/* Selected block info */}
      {selected && (
        <div className="absolute bottom-3 left-3 bg-black/80 border border-brand-500/40 text-white text-xs px-3 py-2 rounded-lg">
          📍 Bloque seleccionado: ({selected.bx}, {selected.by}) · <span className="text-brand-500 font-bold">10×10 px = S/100</span>
        </div>
      )}
    </div>
  )
}
