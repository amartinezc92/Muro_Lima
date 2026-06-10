import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadSpaceImage } from '../services/storage'

export default function BuyModal({ selection, onClose, onSuccess }) {
  const [email, setEmail]         = useState('')
  const [url, setUrl]             = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [preview, setPreview]     = useState(null)
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [status, setStatus]       = useState('')
  const fileRef = useRef()

  if (!selection) return null
  const { x, y, w, h, pixels } = selection
  const price = pixels

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(v => ({ ...v, image: 'Máximo 5 MB' })); return }
    setImageFile(file)
    setPreview(URL.createObjectURL(file))
    setErrors(v => { const c = { ...v }; delete c.image; return c })
  }

  async function handlePay() {
    const e = {}
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido'
    if (!imageFile) e.image = 'Sube tu imagen'
    if (Object.keys(e).length) { setErrors(e); return }

    setLoading(true)
    try {
      setStatus('Subiendo imagen...')
      const imageUrl = await uploadSpaceImage(imageFile)

      setStatus('Guardando...')
      const { data: purchase, error: pErr } = await supabase
        .from('purchases')
        .insert({
          email,
          business_name:    url || email,
          destination_link: url,
          image_url:        imageUrl,
          pixel_count:      pixels,
          px: x, py: y, pw: w, ph: h,
          amount: price, currency: 'PEN', status: 'pending',
        })
        .select().single()

      if (pErr) throw new Error(pErr.message)

      setStatus('Redirigiendo...')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, purchaseId: purchase.id, pixelCount: pixels, price }),
        }
      )
      const { url: checkoutUrl, error: stripeErr } = await res.json()
      if (stripeErr) throw new Error(stripeErr)
      window.location.href = checkoutUrl
    } catch (err) {
      setErrors({ submit: err.message })
      setLoading(false)
      setStatus('')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-up">

        {/* Header */}
        <div className="p-6 border-b border-zinc-900">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-widest">Tu espacio</p>
              <div className="flex items-baseline gap-2">
                <span className="text-white font-bold text-2xl">{pixels.toLocaleString()}</span>
                <span className="text-zinc-500 text-sm">píxeles</span>
              </div>
              <p className="text-zinc-600 text-xs mt-0.5">{w}×{h} px · posición ({x}, {y})</p>
            </div>
            <div className="text-right">
              <p className="text-orange-500 font-bold text-2xl">S/{price.toLocaleString()}</p>
              <p className="text-zinc-600 text-xs">pago único</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-zinc-600 hover:text-zinc-300 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-zinc-900 transition-all text-lg leading-none"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">

          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition-all group ${
              errors.image ? 'border-red-800 bg-red-950/20' : 'border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900/40'
            }`}
          >
            {preview ? (
              <img src={preview} alt="" className="h-20 mx-auto rounded-lg object-contain" />
            ) : (
              <div>
                <div className="text-zinc-600 group-hover:text-zinc-400 transition-colors mb-2">
                  <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-zinc-400 text-sm">Sube tu imagen o logo</p>
                <p className="text-zinc-700 text-xs mt-1">JPG, PNG · máx 5 MB</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
          </div>
          {errors.image && <p className="text-red-500 text-xs -mt-2">{errors.image}</p>}

          {/* URL */}
          <div>
            <label className="block text-zinc-500 text-xs mb-1.5">URL de destino</label>
            <input
              type="url"
              value={url}
              placeholder="https://tu-web.com"
              onChange={e => setUrl(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-700 text-sm focus:outline-none transition-colors"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-zinc-500 text-xs mb-1.5">Email para el recibo</label>
            <input
              type="email"
              value={email}
              placeholder="tu@email.com"
              onChange={e => setEmail(e.target.value)}
              className={`w-full bg-zinc-900 border rounded-xl px-3.5 py-2.5 text-white placeholder-zinc-700 text-sm focus:outline-none transition-colors ${
                errors.email ? 'border-red-800' : 'border-zinc-800 focus:border-zinc-600'
              }`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {errors.submit && (
            <p className="text-red-500 text-xs bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">{errors.submit}</p>
          )}

          <button
            onClick={handlePay}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all shadow-[0_0_0_0_theme(colors.orange.500)] hover:shadow-[0_0_20px_0px_theme(colors.orange.500/25)] mt-1"
          >
            {loading ? (status || 'Procesando...') : `Pagar S/${price.toLocaleString()} →`}
          </button>

          <p className="text-center text-zinc-700 text-xs">Stripe · pago seguro · sin suscripción</p>
        </div>

      </div>
    </div>
  )
}
