import { useState, useEffect, useCallback } from 'react'
import { fetchSpaces } from '../services/database'

// Generates 300 placeholder spaces (20 cols × 15 rows) if DB is empty
function buildPlaceholders() {
  const cols = 'ABCDEFGHIJKLMNOPQRST'
  return Array.from({ length: 300 }, (_, i) => {
    const col = cols[i % 20]
    const row = Math.floor(i / 20) + 1
    return { id: null, grid_position: `${col}${row}`, status: 'available', _placeholder: true }
  })
}

export function useSpaces(filters = {}) {
  const [spaces, setSpaces]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchSpaces(filters)
      // Merge DB data into 300-slot grid
      const placeholders = buildPlaceholders()
      data.forEach(dbSpace => {
        const idx = placeholders.findIndex(p => p.grid_position === dbSpace.grid_position)
        if (idx !== -1) placeholders[idx] = { ...dbSpace, _placeholder: false }
      })
      setSpaces(placeholders)
      setError(null)
    } catch (err) {
      // On DB error (missing env vars) use empty placeholders so UI still renders
      setSpaces(buildPlaceholders())
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.zone, filters.category])

  useEffect(() => { load() }, [load])

  return { spaces, loading, error, reload: load }
}
