import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function usePurchases() {
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]     = useState(true)

  async function load() {
    const { data } = await supabase
      .from('purchases')
      .select('id, pixel_start, pixel_count, business_name, image_url, color, status, destination_link')
      .eq('status', 'completed')
    setPurchases(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const soldPixels = purchases.reduce((s, p) => s + (p.pixel_count || 0), 0)

  return { purchases, loading, soldPixels, reload: load }
}
