import { useState } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// SVG paths for Lima districts (approximate, hand-crafted for visual clarity)
// ViewBox: 0 0 700 780
// West = Pacific Ocean (left edge)
// North = top, South = bottom
// ─────────────────────────────────────────────────────────────────────────────
export const DISTRICTS = [
  {
    slug: 'callao',
    name: 'Callao',
    // Large port district, northwest
    path: 'M 0,0 L 180,0 L 200,40 L 210,90 L 190,140 L 160,170 L 130,180 L 90,175 L 50,160 L 20,130 L 0,90 Z',
    labelX: 90, labelY: 90,
    color: '#1e40af',
  },
  {
    slug: 'rimac',
    name: 'Rímac',
    path: 'M 180,0 L 320,0 L 340,30 L 330,80 L 310,110 L 280,120 L 250,115 L 220,100 L 200,80 L 200,40 Z',
    labelX: 260, labelY: 55,
    color: '#7c3aed',
  },
  {
    slug: 'lima-centro',
    name: 'Lima\nCentro',
    path: 'M 200,40 L 200,80 L 220,100 L 250,115 L 280,120 L 310,110 L 330,80 L 340,30 L 380,30 L 400,60 L 400,130 L 370,160 L 340,170 L 300,170 L 260,155 L 230,140 L 210,120 L 210,90 Z',
    labelX: 300, labelY: 105,
    color: '#b45309',
  },
  {
    slug: 'brena',
    name: 'Breña',
    path: 'M 150,170 L 190,140 L 210,120 L 230,140 L 260,155 L 255,185 L 230,200 L 200,205 L 170,195 Z',
    labelX: 207, labelY: 175,
    color: '#0f766e',
  },
  {
    slug: 'la-victoria',
    name: 'La Victoria',
    path: 'M 260,155 L 300,170 L 340,170 L 370,160 L 390,185 L 380,220 L 350,240 L 310,245 L 275,230 L 255,205 L 255,185 Z',
    labelX: 320, labelY: 202,
    color: '#9f1239',
  },
  {
    slug: 'san-luis',
    name: 'San Luis',
    path: 'M 370,160 L 400,130 L 430,140 L 450,165 L 440,200 L 410,215 L 390,210 L 380,220 L 370,160 Z',
    labelX: 410, labelY: 182,
    color: '#065f46',
  },
  {
    slug: 'ate',
    name: 'Ate',
    path: 'M 400,60 L 480,60 L 560,80 L 620,110 L 640,160 L 630,220 L 590,260 L 550,280 L 510,275 L 470,255 L 450,230 L 440,200 L 450,165 L 430,140 L 400,130 Z',
    labelX: 520, labelY: 170,
    color: '#92400e',
  },
  {
    slug: 'jesus-maria',
    name: 'Jesús\nMaría',
    path: 'M 150,170 L 170,195 L 200,205 L 220,220 L 215,250 L 190,265 L 160,260 L 135,240 L 130,210 Z',
    labelX: 175, labelY: 222,
    color: '#1d4ed8',
  },
  {
    slug: 'pueblo-libre',
    name: 'Pueblo\nLibre',
    path: 'M 90,175 L 130,180 L 150,170 L 130,210 L 135,240 L 115,255 L 85,250 L 70,225 L 75,195 Z',
    labelX: 105, labelY: 215,
    color: '#7e22ce',
  },
  {
    slug: 'lince',
    name: 'Lince',
    path: 'M 255,185 L 275,230 L 265,255 L 240,265 L 215,250 L 220,220 L 230,200 Z',
    labelX: 247, labelY: 232,
    color: '#be185d',
  },
  {
    slug: 'san-isidro',
    name: 'San Isidro',
    path: 'M 160,260 L 190,265 L 215,250 L 240,265 L 265,255 L 275,280 L 280,320 L 270,355 L 245,370 L 210,365 L 185,345 L 170,310 L 155,280 Z',
    labelX: 217, labelY: 312,
    color: '#d97706',
  },
  {
    slug: 'magdalena',
    name: 'Magdalena',
    path: 'M 75,250 L 85,250 L 115,255 L 135,240 L 160,260 L 155,280 L 140,300 L 110,305 L 80,295 L 60,270 Z',
    labelX: 108, labelY: 275,
    color: '#0369a1',
  },
  {
    slug: 'san-miguel',
    name: 'San Miguel',
    path: 'M 0,90 L 20,130 L 50,160 L 90,175 L 75,195 L 70,225 L 60,270 L 40,290 L 10,280 L 0,240 Z',
    labelX: 38, labelY: 200,
    color: '#15803d',
  },
  {
    slug: 'miraflores',
    name: 'Miraflores',
    path: 'M 80,295 L 110,305 L 140,300 L 155,280 L 170,310 L 185,345 L 180,385 L 160,410 L 130,420 L 100,410 L 75,385 L 65,350 L 60,310 Z',
    labelX: 122, labelY: 360,
    color: '#dc2626',
  },
  {
    slug: 'surquillo',
    name: 'Surquillo',
    path: 'M 265,255 L 310,245 L 330,265 L 335,300 L 320,330 L 295,340 L 270,335 L 255,310 L 255,280 L 275,280 Z',
    labelX: 295, labelY: 297,
    color: '#0891b2',
  },
  {
    slug: 'san-borja',
    name: 'San Borja',
    path: 'M 310,245 L 350,240 L 390,250 L 410,280 L 415,320 L 400,355 L 370,365 L 340,360 L 320,330 L 335,300 L 330,265 Z',
    labelX: 363, labelY: 305,
    color: '#7c3aed',
  },
  {
    slug: 'san-isidro-este',
    // Folded into San Borja zone visually — skip
    name: null,
    path: '',
    labelX: 0, labelY: 0,
    color: 'transparent',
  },
  {
    slug: 'barranco',
    name: 'Barranco',
    path: 'M 65,350 L 75,385 L 100,410 L 130,420 L 130,455 L 105,470 L 75,460 L 50,435 L 45,400 L 50,365 Z',
    labelX: 88, labelY: 415,
    color: '#059669',
  },
  {
    slug: 'chorrillos',
    name: 'Chorrillos',
    path: 'M 45,400 L 50,435 L 75,460 L 105,470 L 130,455 L 155,470 L 160,520 L 140,570 L 100,590 L 55,575 L 20,545 L 0,510 L 0,450 L 20,420 Z',
    labelX: 85, labelY: 510,
    color: '#0f766e',
  },
  {
    slug: 'surco',
    name: 'Surco',
    path: 'M 270,335 L 295,340 L 320,330 L 340,360 L 370,365 L 400,355 L 430,370 L 460,400 L 470,450 L 450,500 L 410,530 L 360,540 L 310,525 L 270,490 L 250,450 L 245,400 L 245,370 L 270,355 Z',
    labelX: 355, labelY: 445,
    color: '#b45309',
  },
  {
    slug: 'la-molina',
    name: 'La Molina',
    path: 'M 470,255 L 510,275 L 550,280 L 590,260 L 630,220 L 660,240 L 680,290 L 680,370 L 650,430 L 600,480 L 540,510 L 480,510 L 470,450 L 460,400 L 430,370 L 400,355 L 415,320 L 410,280 L 390,250 L 450,230 Z',
    labelX: 565, labelY: 380,
    color: '#1d4ed8',
  },
]

// Ocean shape (Pacific, left side)
const OCEAN_PATH = 'M 0,0 L 0,780 L -10,780 L -10,0 Z'

// Status → fill opacity
function districtFill(district, spaceData) {
  const d = spaceData?.[district.slug]
  if (!d) return { fill: district.color, opacity: 0.25 }
  const pct = d.sold_pixels / d.total_pixels
  if (pct === 0)   return { fill: district.color, opacity: 0.2 }
  if (pct < 0.5)   return { fill: district.color, opacity: 0.45 }
  if (pct < 0.9)   return { fill: district.color, opacity: 0.7 }
  return { fill: district.color, opacity: 0.95 }
}

export default function LimaMap({ spaceData = {}, onSelectDistrict }) {
  const [hovered, setHovered] = useState(null)

  const validDistricts = DISTRICTS.filter(d => d.name && d.path)

  return (
    <div className="relative w-full flex justify-center">
      <svg
        viewBox="0 0 700 780"
        className="w-full max-w-2xl drop-shadow-2xl"
        style={{ maxHeight: '80vh' }}
      >
        {/* Ocean gradient background */}
        <defs>
          <linearGradient id="oceanGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0c4a6e" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          {/* Clip mask for each district to contain pixel fills */}
          {validDistricts.map(d => (
            <clipPath key={`clip-${d.slug}`} id={`clip-${d.slug}`}>
              <path d={d.path} />
            </clipPath>
          ))}
        </defs>

        {/* Map background */}
        <rect width="700" height="780" fill="url(#bgGrad)" />

        {/* Pacific Ocean strip */}
        <rect x="0" y="0" width="15" height="780" fill="url(#oceanGrad)" opacity="0.6" />
        <text x="6" y="400" fill="#38bdf8" fontSize="9" fontFamily="sans-serif"
              transform="rotate(-90 6 400)" textAnchor="middle" opacity="0.5">
          OCÉANO PACÍFICO
        </text>

        {/* Districts */}
        {validDistricts.map(d => {
          const { fill, opacity } = districtFill(d, spaceData)
          const space = spaceData?.[d.slug]
          const pct = space ? space.sold_pixels / space.total_pixels : 0
          const isHovered = hovered === d.slug
          const isFull = space?.status === 'full'

          return (
            <g key={d.slug}
               className="cursor-pointer"
               onMouseEnter={() => setHovered(d.slug)}
               onMouseLeave={() => setHovered(null)}
               onClick={() => !isFull && onSelectDistrict?.(d, space)}>

              {/* Base district shape */}
              <path
                d={d.path}
                fill={fill}
                fillOpacity={isHovered ? Math.min(opacity + 0.2, 1) : opacity}
                stroke={isHovered ? '#ffffff' : 'rgba(255,255,255,0.2)'}
                strokeWidth={isHovered ? 1.5 : 0.75}
                filter={isHovered ? 'url(#glow)' : undefined}
                style={{ transition: 'all 0.15s ease' }}
              />

              {/* Pixel fill progress overlay */}
              {pct > 0 && (
                <clipPath id={`progress-${d.slug}`}>
                  <path d={d.path} />
                </clipPath>
              )}

              {/* Full badge */}
              {isFull && (
                <text x={d.labelX} y={d.labelY + 12} textAnchor="middle"
                      fill="white" fontSize="7" fontWeight="bold" opacity="0.9">
                  LLENO
                </text>
              )}

              {/* District label */}
              {d.name.split('\n').map((line, i) => (
                <text
                  key={i}
                  x={d.labelX}
                  y={d.labelY + i * 10 - (d.name.includes('\n') ? 5 : 0)}
                  textAnchor="middle"
                  fill="white"
                  fontSize={isHovered ? 9 : 8}
                  fontWeight={isHovered ? 'bold' : '600'}
                  fontFamily="Inter, sans-serif"
                  opacity={isHovered ? 1 : 0.85}
                  style={{ transition: 'all 0.15s', pointerEvents: 'none', userSelect: 'none' }}
                  filter={isHovered ? 'url(#glow)' : undefined}
                >
                  {line}
                </text>
              ))}

              {/* % fill indicator */}
              {pct > 0 && !isFull && (
                <text x={d.labelX} y={d.labelY + (d.name.includes('\n') ? 18 : 10)}
                      textAnchor="middle" fill="white" fontSize="6.5"
                      fontFamily="Inter, sans-serif" opacity="0.7"
                      style={{ pointerEvents: 'none' }}>
                  {Math.round(pct * 100)}% ocupado
                </text>
              )}
            </g>
          )
        })}

        {/* Compass rose */}
        <g transform="translate(650,30)">
          <circle cx="0" cy="0" r="16" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5"/>
          <text x="0" y="-5" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">N</text>
          <polygon points="0,-12 3,-3 -3,-3" fill="white" opacity="0.8"/>
          <polygon points="0,12 3,3 -3,3" fill="rgba(255,255,255,0.3)" opacity="0.6"/>
        </g>

        {/* Title */}
        <text x="350" y="760" textAnchor="middle" fill="white" fontSize="11"
              fontFamily="Inter, sans-serif" opacity="0.3" letterSpacing="3">
          EL MURO DE LIMA · MAPA INTERACTIVO
        </text>
      </svg>

      {/* Hover tooltip */}
      {hovered && (() => {
        const d = validDistricts.find(x => x.slug === hovered)
        const s = spaceData?.[hovered]
        if (!d || !s) return null
        const pct = Math.round((s.sold_pixels / s.total_pixels) * 100)
        const available = s.total_pixels - s.sold_pixels
        return (
          <div className="absolute top-4 left-4 bg-black/90 border border-white/10 rounded-xl p-4 min-w-44 pointer-events-none animate-fade-in shadow-xl">
            <div className="font-bold text-white text-sm mb-2">{d.name.replace('\n', ' ')}</div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Precio</span>
                <span className="text-brand-500 font-bold">S/{s.base_price_per_px}/px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Disponibles</span>
                <span className="text-green-400 font-semibold">{available.toLocaleString()} px</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ocupado</span>
                <span className="text-white">{pct}%</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5 mt-1">
                <div className="h-1.5 rounded-full bg-brand-500 transition-all"
                     style={{ width: `${pct}%`, backgroundColor: d.color }} />
              </div>
            </div>
            <div className="mt-3 text-brand-500 text-xs font-semibold">Click para comprar →</div>
          </div>
        )
      })()}
    </div>
  )
}
