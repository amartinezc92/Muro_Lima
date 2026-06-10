import { supabase } from '../lib/supabase'

const BUCKET = 'spaces'
const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function uploadSpaceImage(file) {
  if (file.size > MAX_BYTES) throw new Error('La imagen debe ser menor a 5 MB')

  const ext = file.name.split('.').pop()
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

  const { error } = await supabase.storage.from(BUCKET).upload(filename, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  })
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename)
  return data.publicUrl
}
