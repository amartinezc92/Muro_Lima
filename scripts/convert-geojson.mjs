import { readFileSync, writeFileSync } from 'fs'

const KEEP = new Set([
  'Miraflores','San Isidro','Barranco','Santiago de Surco','La Molina',
  'San Borja','Magdalena del Mar','San Miguel','Pueblo Libre','Jesús María',
  'Lince','La Victoria','Lima','Rímac','Breña','Surquillo','Chorrillos',
  'San Luis','Ate','El Agustino','San Juan de Miraflores','Villa María del Triunfo',
  'Villa El Salvador','Lurín','Pachacámac','San Juan de Lurigancho','Santa Anita',
  'Comas','Los Olivos','Independencia','San Martín de Porres','Carabayllo',
  'Puente Piedra','Callao','Chaclacayo','Lurigancho','Cieneguilla','Ancón',
])

const data = JSON.parse(readFileSync('public/lima-districts.json', 'utf-8'))

function close(a, b) {
  return Math.abs(a[0] - b[0]) < 0.00005 && Math.abs(a[1] - b[1]) < 0.00005
}

function stitchRings(ways) {
  if (ways.length === 0) return []
  const rings = []
  let remaining = ways.map(w => [...w])
  while (remaining.length > 0) {
    let ring = remaining.shift()
    let changed = true
    while (changed) {
      changed = false
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i]
        const rEnd = ring[ring.length - 1]
        if (close(rEnd, w[0])) {
          ring = ring.concat(w.slice(1))
          remaining.splice(i, 1)
          changed = true; break
        } else if (close(rEnd, w[w.length - 1])) {
          ring = ring.concat([...w].reverse().slice(1))
          remaining.splice(i, 1)
          changed = true; break
        }
      }
    }
    if (ring.length >= 3) {
      if (!close(ring[0], ring[ring.length - 1])) ring.push(ring[0])
      rings.push(ring)
    }
  }
  return rings
}

const features = []
for (const rel of data.elements) {
  if (rel.type !== 'relation') continue
  const name = rel.tags?.name ?? 'Desconocido'
  if (!KEEP.has(name)) continue
  const members = rel.members ?? []
  const outerCoords = members
    .filter(m => m.type === 'way' && m.role === 'outer' && m.geometry)
    .map(m => m.geometry.map(pt => [pt.lon, pt.lat]))
  if (outerCoords.length === 0) continue
  const rings = stitchRings(outerCoords)
  if (rings.length === 0) continue
  // Keep point only if far enough from previous (≈200m threshold)
  const decimate = (coords, tol = 0.008) => {
    const out = [coords[0]]
    for (let i = 1; i < coords.length - 1; i++) {
      const [ax, ay] = out[out.length - 1]
      const [bx, by] = coords[i]
      if (Math.abs(bx - ax) > tol || Math.abs(by - ay) > tol) out.push(coords[i])
    }
    if (coords.length > 1) out.push(coords[coords.length - 1]) // keep last
    return out.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)])
  }
  const simplifiedRings = rings.map(decimate).filter(r => r.length >= 4)
  if (simplifiedRings.length === 0) continue
  features.push({
    type: 'Feature',
    properties: { name, admin_level: rel.tags?.admin_level },
    geometry: {
      type: simplifiedRings.length === 1 ? 'Polygon' : 'MultiPolygon',
      coordinates: simplifiedRings.length === 1 ? simplifiedRings : simplifiedRings.map(r => [r]),
    },
  })
}

const geojson = { type: 'FeatureCollection', features }
writeFileSync('public/lima-geojson.json', JSON.stringify(geojson))
console.log(`Done: ${features.length} districts → public/lima-geojson.json`)
