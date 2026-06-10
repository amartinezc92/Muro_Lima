// Supabase Edge Function: POST /functions/v1/stripe-webhook
// Listens for Stripe events and updates DB + sends email via Brevo.
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@13.11.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature') ?? ''
  const body      = await req.text()

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '',
    )
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session  = event.data.object as Stripe.Checkout.Session
    const meta     = session.metadata ?? {}
    const purchaseId = Number(meta.purchaseId)
    const spaceId    = Number(meta.spaceId)

    // 1. Mark purchase completed
    await supabase.from('purchases').update({
      status:             'completed',
      stripe_session_id:  session.id,
      payment_intent_id:  session.payment_intent as string,
      updated_at:         new Date().toISOString(),
    }).eq('id', purchaseId)

    // 2. Mark space as pending review
    if (spaceId) {
      await supabase.from('spaces').update({ status: 'pending' }).eq('id', spaceId)
    }

    // 3. Send confirmation email via Brevo
    const email = session.customer_email ?? ''
    if (email) {
      await sendConfirmationEmail(email, meta.tier ?? '', purchaseId)
    }

    // 4. Notify admin
    await notifyAdmin(email, meta.tier ?? '', purchaseId)
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

async function sendConfirmationEmail(to: string, tier: string, purchaseId: number) {
  const brevoKey = Deno.env.get('BREVO_API_KEY') ?? ''
  if (!brevoKey) return

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:  { name: 'El Muro de Lima', email: 'hola@murodlima.com' },
      to:      [{ email: to }],
      subject: '¡Tu espacio en El Muro está en validación! 🎉',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;color:#1f2937">
          <div style="background:#f97316;padding:24px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0;font-size:24px">El Muro de Lima</h1>
          </div>
          <div style="background:#f9fafb;padding:24px;border-radius:0 0 12px 12px">
            <h2 style="color:#111827">¡Tu pago fue confirmado!</h2>
            <p>Hemos recibido tu pago por el plan <strong style="color:#f97316;text-transform:capitalize">${tier}</strong>.</p>
            <p>Nuestro equipo revisará tu imagen y enlace en las próximas <strong>24 horas hábiles</strong>.</p>
            <p>Pedido #${purchaseId}</p>
            <div style="background:white;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
              <p style="margin:0;font-weight:600">¿Tienes dudas?</p>
              <p style="margin:4px 0 0">Escríbenos: <a href="mailto:hola@murodlima.com">hola@murodlima.com</a></p>
            </div>
            <p style="font-size:12px;color:#9ca3af">El Muro de Lima · Lima, Perú</p>
          </div>
        </div>
      `,
    }),
  })
}

async function notifyAdmin(customerEmail: string, tier: string, purchaseId: number) {
  const brevoKey   = Deno.env.get('BREVO_API_KEY') ?? ''
  const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? 'admin@murodlima.com'
  if (!brevoKey) return

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method:  'POST',
    headers: { 'api-key': brevoKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender:  { name: 'El Muro de Lima Bot', email: 'bot@murodlima.com' },
      to:      [{ email: adminEmail }],
      subject: `[Admin] Nueva compra #${purchaseId} · Plan ${tier}`,
      htmlContent: `
        <p>Nueva compra pendiente de validación:</p>
        <ul>
          <li>Pedido: #${purchaseId}</li>
          <li>Plan: ${tier}</li>
          <li>Cliente: ${customerEmail}</li>
        </ul>
        <a href="https://murodlima.com/admin" style="background:#f97316;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:12px">
          Ir al Panel Admin →
        </a>
      `,
    }),
  })
}
