import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function usePixelBlocks() {
  const [blocks, setBlocks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ sold: 0, total: 1_000_000 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('spaces')
        .select('*')
        .eq('status', 'sold')

      if (error) throw error

      // Pre-load images for blocks that have one
      const withImages = await Promise.all(
        (data ?? []).map(async b => {
          if (b.image_url) {
            const img = new Image()
            img.crossOrigin = 'anonymous'
            await new Promise(res => { img.onload = res; img.onerror = res; img.src = b.image_url })
            return { ...b, x: b.block_x, y: b.block_y, w: b.block_w, h: b.block_h, image: img }
          }
          return { ...b, x: b.block_x, y: b.block_y, w: b.block_w, h: b.block_h }
        })
      )

      setBlocks(withImages)
      const soldPx = withImages.reduce((s, b) => s + b.w * b.h, 0)
      setStats({ sold: soldPx, total: 1_000_000 })
    } catch {
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return { blocks, loading, stats, reload: load }
}
