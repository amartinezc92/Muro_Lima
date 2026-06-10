// Supabase Edge Function: POST /functions/v1/create-checkout
// Creates a Stripe Checkout session and returns the redirect URL.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const PRICE_MAP: Record<string, number> = {
  basic:   9900,   // S/99 in centavos
  premium: 29900,
  ultra:   79900,
}

const TIER_NAMES: Record<string, string> = {
  basic:   'Espacio Básico (2×2)',
  premium: 'Espacio Premium (4×2)',
  ultra:   'Espacio Ultra (6×4)',
}

const corsHeaders = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { spaceId, tier, email, purchaseId } = await req.json()

    if (!tier || !PRICE_MAP[tier]) {
      return new Response(JSON.stringify({ error: 'Invalid tier' }), { status: 400, headers: corsHeaders })
    }

    const origin = req.headers.get('origin') ?? 'https://murodlima.com'

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      customer_email:       email,
      line_items: [{
        quantity: 1,
        price_data: {
          currency:     'pen',
          unit_amount:  PRICE_MAP[tier],
          product_data: {
            name:        TIER_NAMES[tier],
            description: 'El Muro de Lima · 12 meses de visibilidad',
          },
        },
      }],
      metadata: { spaceId: String(spaceId ?? ''), tier, purchaseId: String(purchaseId ?? '') },
      success_url: `${origin}/success?email=${encodeURIComponent(email)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/?canceled=1`,
    })

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
