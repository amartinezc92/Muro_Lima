import axios from 'axios'

// Points to Supabase Edge Function (or your backend)
const API_BASE = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

export async function createCheckoutSession({ spaceId, tier, email, purchaseId }) {
  const { data } = await axios.post(
    `${API_BASE}/create-checkout`,
    { spaceId, tier, email, purchaseId },
    {
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  )
  return data // { url: 'https://checkout.stripe.com/...' }
}

export const TIERS = {
  basic: {
    name: 'Básico',
    price: 99,
    currency: 'PEN',
    size: '2×2',
    features: ['Logo / Imagen', 'Link a tu negocio', '12 meses'],
    color: 'from-slate-700 to-slate-800',
    badge: null,
  },
  premium: {
    name: 'Premium',
    price: 299,
    currency: 'PEN',
    size: '4×2',
    features: ['Imagen grande', 'Descripción (50 chars)', 'Link a tu negocio', '12 meses'],
    color: 'from-brand-600 to-brand-700',
    badge: 'Más popular',
  },
  ultra: {
    name: 'Ultra',
    price: 799,
    currency: 'PEN',
    size: '6×4',
    features: ['Video / GIF', 'Descripción (50 chars)', 'Analytics avanzados', 'Link a tu negocio', '12 meses'],
    color: 'from-purple-600 to-purple-800',
    badge: 'Premium',
  },
}
