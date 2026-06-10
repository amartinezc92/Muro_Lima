import { supabase } from '../lib/supabase'

// ── Spaces ──────────────────────────────────────────────────────────────────

export async function fetchSpaces({ zone, category } = {}) {
  let query = supabase.from('spaces').select('*').order('grid_position')
  if (zone)     query = query.eq('zone', zone)
  if (category) query = query.eq('business_category', category)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchSpace(id) {
  const { data, error } = await supabase.from('spaces').select('*').eq('id', id).single()
  if (error) throw error
  return data
}

export async function updateSpace(id, fields) {
  const { data, error } = await supabase.from('spaces').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function incrementSpaceView(id) {
  await supabase.rpc('increment_space_views', { space_id: id })
}

export async function incrementSpaceClick(id) {
  await supabase.rpc('increment_space_clicks', { space_id: id })
}

// ── Purchases ────────────────────────────────────────────────────────────────

export async function createPurchase(purchase) {
  const { data, error } = await supabase.from('purchases').insert(purchase).select().single()
  if (error) throw error
  return data
}

export async function fetchPurchasesByStatus(status = 'pending') {
  const { data, error } = await supabase
    .from('purchases')
    .select('*, spaces(grid_position, zone)')
    .eq('status', status)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updatePurchase(id, fields) {
  const { data, error } = await supabase.from('purchases').update(fields).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ── Users / Dashboard ────────────────────────────────────────────────────────

export async function fetchUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*, spaces(*)')
    .eq('email', email)
    .single()
  if (error) throw error
  return data
}

// ── Admin stats ───────────────────────────────────────────────────────────────

export async function fetchAdminStats() {
  const [{ count: total }, { count: sold }, { count: pending }, revenueResult] = await Promise.all([
    supabase.from('spaces').select('*', { count: 'exact', head: true }),
    supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('status', 'sold'),
    supabase.from('spaces').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('purchases').select('amount').eq('status', 'completed'),
  ])
  const revenue = revenueResult.data?.reduce((sum, p) => sum + Number(p.amount), 0) ?? 0
  return { total, sold, pending, revenue }
}
