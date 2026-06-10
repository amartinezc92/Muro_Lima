import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// District metadata: slug → color + display info
const DISTRICT_META = {
  'Miraflores':   { color: '#dc2626', price: 2.00 },
  'San Isidro':   { color: '#d97706', price: 2.50 },
  'Barranco':     { color: '#059669', price: 1.50 },
  'Surco':        { color: '#b45309', price: 1.00 },
  'La Molina':    { color: '#1d4ed8', price: 1.00 },
  'San Borja':    { color: '#7c3aed', price: 1.50 },
  'Magdalena del Mar': { color: '#0369a1', price: 1.00 },
  'San Miguel':   { color: '#15803d', price: 1.00 },
  'Pueblo Libre': { color: '#6d28d9', price: 1.00 },
  'Jesús María':  { color: '#1d4ed8', price: 1.00 },
  'Lince':        { color: '#be185d', price: 1.00 },
  'La Victoria':  { color: '#9f1239', price: 0.80 },
  'Lima':         { color: '#b45309', price: 1.20 },
  'Rímac':        { color: '#7c3aed', price: 0.80 },
  'Breña':        { color: '#0f766e', price: 0.80 },
  'Surquillo':    { color: '#0891b2', price: 1.00 },
  'Chorrillos':   { color: '#0f766e', price: 0.80 },
  'San Luis':     { color: '#065f46', price: 0.80 },
  'Ate':          { color: '#92400e', price: 0.70 },
  'Callao':       { color: '#1e40af', price: 0.80 },
  'Santiago de Surco': { color: '#b45309', price: 1.00 },
  'El Agustino':  { color: '#7e22ce', price: 0.70 },
  'San Juan de Miraflores': { color: '#166534', price: 0.70 },
  'Villa María del Triunfo': { color: '#1e3a8a', price: 0.60 },
  'Villa El Salvador': { color: '#7c2d12', price: 0.60 },
  'Lurín':        { color: '#064e3b', price: 0.60 },
  'Pachacámac':   { color: '#78350f', price: 0.50 },
  'San Juan de Lurigancho': { color: '#0c4a6e', price: 0.60 },
  'Santa Anita':  { color: '#4c1d95', price: 0.70 },
  'Comas':        { color: '#1e3a8a', price: 0.60 },
  'Los Olivos':   { color: '#14532d', price: 0.70 },
  'Independencia':{ color: '#450a0a', price: 0.60 },
  'San Martín de Porres': { color: '#1a2e05', price: 0.70 },
  'Carabayllo':   { color: '#0c2340', price: 0.50 },
  'Puente Piedra':{ color: '#1c1917', price: 0.50 },
}

function getSlug(name) {
  return name?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
}

function getMeta(name) {
  return DISTRICT_META[name] ?? { color: '#334155', price: 0.80 }
}

// Overpass API query — fetches all Lima metropolitan districts
const OVERPASS_QUERY = `
[out:json][timeout:60];
area["name"="Lima"]["admin_level"="4"]["boundary"="administrative"]->.lima;
(
  relation["boundary"="administrative"]["admin_level"="8"](area.lima);
);
out body;
>;
out skel qt;
`

// Convert Overpass JSON → GeoJSON FeatureCollection
function overpassToGeoJSON(data) {
  const nodes = {}
  const ways  = {}
  const relations = []

  data.elements.forEach(el => {
    if (el.type === 'node') nodes[el.id] = [el.lon, el.lat]
    else if (el.type === 'way') ways[el.id] = el.nodes
    else if (el.type === 'relation') relations.push(el)
  })

  const features = []

  relations.forEach(rel => {
    const name = rel.tags?.name ?? rel.tags?.['name:es'] ?? 'Desconocido'
    // Build outer rings
    const outerWayIds = (rel.members ?? [])
      .filter(m => m.type === 'way' && m.role === 'outer')
      .map(m => m.ref)

    // Stitch ways into rings
    const rings = []
    let current = []

    outerWayIds.forEach(wid => {
      const nodeIds = ways[wid]
      if (!nodeIds) return
      const coords = nodeIds.map(nid => nodes[nid]).filter(Boolean)
      if (current.length === 0) {
        current = coords
      } else {
        const lastPt  = current[current.length - 1]
        const firstPt = coords[0]
        const lastPt2 = coords[coords.length - 1]
        if (lastPt && firstPt &&
            Math.abs(lastPt[0] - firstPt[0]) < 0.0001 &&
            Math.abs(lastPt[1] - firstPt[1]) < 0.0001) {
          current = current.concat(coords.slice(1))
        } else if (lastPt && lastPt2 &&
                   Math.abs(lastPt[0] - lastPt2[0]) < 0.0001 &&
                   Math.abs(lastPt[1] - lastPt2[1]) < 0.0001) {
          current = current.concat([...coords].reverse().slice(1))
        } else {
          rings.push(current)
          current = coords
        }
      }
    })
    if (current.length > 0) rings.push(current)

    if (rings.length === 0) return

    // Close rings
    const closedRings = rings.map(ring => {
      if (ring.length < 3) return null
      const first = ring[0]; const last = ring[ring.length - 1]
      if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
      return ring
    }).filter(Boolean)

    if (closedRings.length === 0) return

    features.push({
      type: 'Feature',
      properties: { name, ...rel.tags },
      geometry: {
        type: closedRings.length === 1 ? 'Polygon' : 'MultiPolygon',
        coordinates: closedRings.length === 1
          ? [closedRings[0]]
          : closedRings.map(r => [r]),
      },
    })
  })

  return { type: 'FeatureCollection', features }
}

export default function LimaLeafletMap({ spaceData = {}, onSelectDistrict }) {
  const mapRef       = useRef(null)
  const leafletRef   = useRef(null)
  const geoJsonRef   = useRef(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [hovered, setHovered]   = useState(null)

  // Init Leaflet map
  useEffect(() => {
    if (leafletRef.current) return

    const map = L.map(mapRef.current, {
      center:    [-12.05, -77.03],
      zoom:      11,
      zoomControl: true,
      attributionControl: true,
    })

    // Dark OSM tiles via CartoDB Dark Matter
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains:  'abcd',
      maxZoom:     19,
    }).addTo(map)

    leafletRef.current = map

    // Fetch Lima districts from Overpass
    fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body:   'data=' + encodeURIComponent(OVERPASS_QUERY),
    })
      .then(r => r.json())
      .then(data => {
        const geojson = overpassToGeoJSON(data)
        renderGeoJSON(map, geojson)
        setLoading(false)
      })
      .catch(err => {
        setError('No se pudo cargar el mapa. Revisa tu conexión.')
        setLoading(false)
        console.error(err)
      })

    return () => {
      map.remove()
      leafletRef.current = null
    }
  }, [])

  function renderGeoJSON(map, geojson) {
    if (geoJsonRef.current) {
      geoJsonRef.current.remove()
    }

    const layer = L.geoJSON(geojson, {
      style: feature => {
        const name   = feature.properties?.name ?? ''
        const meta   = getMeta(name)
        const slug   = getSlug(name)
        const space  = spaceData[slug]
        const pct    = space ? space.sold_pixels / space.total_pixels : 0

        return {
          fillColor:   meta.color,
          fillOpacity: 0.2 + pct * 0.5,
          color:       meta.color,
          weight:      1.5,
          opacity:     0.7,
        }
      },
      onEachFeature: (feature, layer) => {
        const name  = feature.properties?.name ?? 'Distrito'
        const meta  = getMeta(name)
        const slug  = getSlug(name)
        const space = spaceData[slug]

        layer.bindTooltip(
          `<div style="font-family:Inter,sans-serif;font-size:13px;font-weight:700;color:white">${name}</div>
           <div style="font-size:11px;color:#f97316;margin-top:2px">S/${meta.price}/px</div>
           ${space ? `<div style="font-size:10px;color:#94a3b8;margin-top:1px">${(space.total_pixels - space.sold_pixels).toLocaleString()} px disponibles</div>` : ''}`,
          {
            className:  'lima-tooltip',
            direction:  'top',
            permanent:  false,
            sticky:     true,
          }
        )

        layer.on({
          mouseover(e) {
            e.target.setStyle({
              fillOpacity: 0.65,
              weight:      2.5,
              color:       '#ffffff',
            })
            setHovered(name)
          },
          mouseout(e) {
            geoJsonRef.current?.resetStyle(e.target)
            setHovered(null)
          },
          click() {
            onSelectDistrict?.({ name, slug, color: meta.color }, space)
          },
        })
      },
    }).addTo(map)

    geoJsonRef.current = layer
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
         style={{ height: '600px' }}>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[1000] bg-gray-950/90 flex flex-col items-center justify-center gap-3">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Cargando mapa real de Lima...</p>
          <p className="text-gray-600 text-xs">Obteniendo datos de OpenStreetMap</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="absolute inset-0 z-[1000] bg-gray-950/90 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-semibold mb-2">{error}</p>
            <button onClick={() => window.location.reload()}
                    className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm">
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Leaflet container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Hovered district badge */}
      {hovered && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] bg-black/80 border border-white/10 text-white text-sm px-4 py-2 rounded-full pointer-events-none animate-fade-in">
          📍 <span className="font-semibold">{hovered}</span> · Haz clic para comprar píxeles
        </div>
      )}
    </div>
  )
}
