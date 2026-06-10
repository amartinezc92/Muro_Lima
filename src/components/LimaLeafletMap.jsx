import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DISTRICT_META = {
  'Miraflores':              { color: '#dc2626', price: 2.00 },
  'San Isidro':              { color: '#d97706', price: 2.50 },
  'Barranco':                { color: '#059669', price: 1.50 },
  'Santiago de Surco':       { color: '#b45309', price: 1.00 },
  'La Molina':               { color: '#1d4ed8', price: 1.00 },
  'San Borja':               { color: '#7c3aed', price: 1.50 },
  'Magdalena del Mar':       { color: '#0369a1', price: 1.00 },
  'San Miguel':              { color: '#15803d', price: 1.00 },
  'Pueblo Libre':            { color: '#6d28d9', price: 1.00 },
  'Jesús María':             { color: '#1e40af', price: 1.00 },
  'Lince':                   { color: '#be185d', price: 1.00 },
  'La Victoria':             { color: '#9f1239', price: 0.80 },
  'Lima':                    { color: '#b45309', price: 1.20 },
  'Rímac':                   { color: '#7c3aed', price: 0.80 },
  'Breña':                   { color: '#0f766e', price: 0.80 },
  'Surquillo':               { color: '#0891b2', price: 1.00 },
  'Chorrillos':              { color: '#0f766e', price: 0.80 },
  'San Luis':                { color: '#065f46', price: 0.80 },
  'Ate':                     { color: '#92400e', price: 0.70 },
  'El Agustino':             { color: '#7e22ce', price: 0.70 },
  'San Juan de Miraflores':  { color: '#166534', price: 0.70 },
  'Villa María del Triunfo': { color: '#1e3a8a', price: 0.60 },
  'Villa El Salvador':       { color: '#7c2d12', price: 0.60 },
  'Lurín':                   { color: '#064e3b', price: 0.60 },
  'Pachacámac':              { color: '#78350f', price: 0.50 },
  'San Juan de Lurigancho':  { color: '#0c4a6e', price: 0.60 },
  'Santa Anita':             { color: '#4c1d95', price: 0.70 },
  'Comas':                   { color: '#1e3a8a', price: 0.60 },
  'Los Olivos':              { color: '#14532d', price: 0.70 },
  'Independencia':           { color: '#c2410c', price: 0.60 },
  'San Martín de Porres':    { color: '#1a2e05', price: 0.70 },
  'Carabayllo':              { color: '#0c2340', price: 0.50 },
  'Puente Piedra':           { color: '#1c1917', price: 0.50 },
  'Callao':                  { color: '#1e40af', price: 0.80 },
  'Chaclacayo':              { color: '#713f12', price: 0.60 },
  'Lurigancho':              { color: '#365314', price: 0.60 },
  'Cieneguilla':             { color: '#14532d', price: 0.50 },
}

function getMeta(name) {
  return DISTRICT_META[name] ?? { color: '#475569', price: 0.80 }
}

function getSlug(name) {
  return name?.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
}

// Convert Overpass "out geom" response → GeoJSON FeatureCollection
function overpassGeomToGeoJSON(data) {
  const features = []

  for (const rel of data.elements) {
    if (rel.type !== 'relation') continue
    const name = rel.tags?.name ?? 'Desconocido'
    const members = rel.members ?? []

    // Collect outer way geometries
    const outerCoords = members
      .filter(m => m.type === 'way' && m.role === 'outer' && m.geometry)
      .map(m => m.geometry.map(pt => [pt.lon, pt.lat]))

    if (outerCoords.length === 0) continue

    // Stitch ways into closed rings
    const rings = stitchRings(outerCoords)
    if (rings.length === 0) continue

    features.push({
      type: 'Feature',
      properties: { name, ...rel.tags },
      geometry: {
        type: rings.length === 1 ? 'Polygon' : 'MultiPolygon',
        coordinates: rings.length === 1
          ? rings
          : rings.map(r => [r]),
      },
    })
  }

  return { type: 'FeatureCollection', features }
}

function stitchRings(ways) {
  if (ways.length === 0) return []

  const rings   = []
  let remaining = ways.map(w => [...w])

  while (remaining.length > 0) {
    let ring = remaining.shift()

    let changed = true
    while (changed) {
      changed = false
      for (let i = 0; i < remaining.length; i++) {
        const w    = remaining[i]
        const rEnd = ring[ring.length - 1]
        const wSt  = w[0]
        const wEnd = w[w.length - 1]

        const close = (a, b) =>
          Math.abs(a[0] - b[0]) < 0.00005 && Math.abs(a[1] - b[1]) < 0.00005

        if (close(rEnd, wSt)) {
          ring = ring.concat(w.slice(1))
          remaining.splice(i, 1)
          changed = true; break
        } else if (close(rEnd, wEnd)) {
          ring = ring.concat([...w].reverse().slice(1))
          remaining.splice(i, 1)
          changed = true; break
        }
      }
    }

    // Close ring
    if (ring.length >= 3) {
      const first = ring[0]; const last = ring[ring.length - 1]
      if (!close(first, last)) ring.push(first)
      rings.push(ring)
    }
  }
  return rings
}

function close(a, b) {
  return Math.abs(a[0] - b[0]) < 0.00005 && Math.abs(a[1] - b[1]) < 0.00005
}

export default function LimaLeafletMap({ spaceData = {}, onSelectDistrict }) {
  const mapRef     = useRef(null)
  const leafletRef = useRef(null)
  const geoJsonRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [hovered, setHovered] = useState(null)

  useEffect(() => {
    if (leafletRef.current) return

    const map = L.map(mapRef.current, {
      center:     [-12.05, -77.03],
      zoom:       11,
      zoomControl: true,
    })

    // CartoDB Dark Matter — clean dark base map
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)

    leafletRef.current = map

    // Load static GeoJSON from public folder — no CORS issues
    fetch('/lima-districts.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        const geojson = overpassGeomToGeoJSON(data)
        addGeoJSON(map, geojson)
        setLoading(false)
      })
      .catch(err => {
        console.error('Map error:', err)
        setError('No se pudo cargar el mapa. Intenta recargar la página.')
        setLoading(false)
      })

    return () => { map.remove(); leafletRef.current = null }
  }, [])

  function addGeoJSON(map, geojson) {
    if (geoJsonRef.current) geoJsonRef.current.remove()

    const layer = L.geoJSON(geojson, {
      style: feature => {
        const name  = feature.properties?.name ?? ''
        const meta  = getMeta(name)
        const slug  = getSlug(name)
        const space = spaceData[slug]
        const pct   = space ? space.sold_pixels / space.total_pixels : 0

        return {
          fillColor:   meta.color,
          fillOpacity: 0.18 + pct * 0.45,
          color:       meta.color,
          weight:      1.5,
          opacity:     0.8,
        }
      },
      onEachFeature: (feature, lyr) => {
        const name  = feature.properties?.name ?? 'Distrito'
        const meta  = getMeta(name)
        const slug  = getSlug(name)
        const space = spaceData[slug]
        const avail = space ? (space.total_pixels - space.sold_pixels).toLocaleString() : '—'
        const pct   = space ? Math.round((space.sold_pixels / space.total_pixels) * 100) : 0

        lyr.bindTooltip(
          `<div style="font-family:Inter,sans-serif">
             <div style="font-size:14px;font-weight:700;color:white;margin-bottom:4px">${name}</div>
             <div style="font-size:11px;color:#f97316;font-weight:600">S/${meta.price} por píxel</div>
             ${space ? `<div style="font-size:10px;color:#94a3b8;margin-top:2px">${avail} px disponibles · ${pct}% ocupado</div>` : ''}
             <div style="font-size:10px;color:#f97316;margin-top:4px;font-weight:600">Click para comprar →</div>
           </div>`,
          { className: 'lima-tooltip', direction: 'top', sticky: true }
        )

        lyr.on({
          mouseover(e) {
            e.target.setStyle({ fillOpacity: 0.7, weight: 2.5, color: '#ffffff', opacity: 1 })
            setHovered(name)
          },
          mouseout(e) {
            geoJsonRef.current?.resetStyle(e.target)
            setHovered(null)
          },
          click() {
            onSelectDistrict?.(
              { name, slug, color: meta.color, price: meta.price },
              space
            )
          },
        })
      },
    }).addTo(map)

    geoJsonRef.current = layer
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
         style={{ height: '600px' }}>

      {loading && (
        <div className="absolute inset-0 z-[1000] bg-gray-950/90 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-300 text-sm font-medium">Cargando mapa real de Lima...</p>
          <p className="text-gray-600 text-xs">Obteniendo límites de OpenStreetMap</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[1000] bg-gray-950/90 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-semibold mb-3">{error}</p>
            <button onClick={() => window.location.reload()}
                    className="bg-brand-500 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm transition-colors">
              Reintentar
            </button>
          </div>
        </div>
      )}

      <div ref={mapRef} className="w-full h-full" />

      {hovered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-black/85 border border-white/10 text-white text-sm px-4 py-2 rounded-full pointer-events-none animate-fade-in whitespace-nowrap">
          📍 <span className="font-bold">{hovered}</span> · Haz clic para comprar píxeles
        </div>
      )}
    </div>
  )
}
