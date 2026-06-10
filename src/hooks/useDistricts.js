import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDistricts() {
  const [districts, setDistricts] = useState({}) // keyed by slug
  const [list, setList]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [totalStats, setTotalStats] = useState({ soldPixels: 0, totalPixels: 0, revenue: 0 })

  async function load() {
    setLoading(true)
    try {
      const { data } = await supabase.from('spaces').select('*')
      if (!data) return
      const map = {}
      data.forEach(d => { map[d.district_slug] = d })
      setDistricts(map)
      setList(data)

      const soldPixels  = data.reduce((s, d) => s + d.sold_pixels, 0)
      const totalPixels = data.reduce((s, d) => s + d.total_pixels, 0)
      setTotalStats({ soldPixels, totalPixels, revenue: soldPixels }) // 1px = S/1 avg
    } catch {
      setDistricts({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { districts, list, loading, totalStats, reload: load }
}
