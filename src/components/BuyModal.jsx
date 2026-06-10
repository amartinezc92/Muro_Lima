import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadSpaceImage } from '../services/storage'

export default function BuyModal({ selection, onClose, onSuccess }) {
  const [email, setEmail]         = useState('')
  const [url, setUrl]             = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors]       = useState({})
  const [loading, setLoading]     = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const fileRef = useRef()

  if (!selection) return null

  const { x, y, w, h, pixels } = selection
  const price = pixels

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(v => ({ ...v, image: 'Máximo 5 MB' })); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(v => { const c = { ...v }; delete c.image; return c })
  }

  function validate() {
    const e = {}
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido'
    if (!imageFile) e.image = 'Sube tu imagen o logo'
    return e
  }

  async function handlePay() {
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      setStatusMsg('Subiendo imagen...')
      const imageUrl = await uploadSpaceImage(imageFile)

      setStatusMsg('Registrando tu espacio...')
      const { data: purchase, error: pErr } = await supabase
        .from('purchases')
        .insert({
          email,
          business_name:    url || 'Sin nombre',
          destination_link: url,
          image_url:        imageUrl,
          pixel_count:      pixels,
          px: x, py: y, pw: w, ph: h,
          amount:   price,
          currency: 'PEN',
          status:   'pending',
        })
        .select()
        .single()

      if (pErr) throw new Error(pErr.message)

      setStatusMsg('Redirigiendo a pago...')
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, purchaseId: purchase.id, pixelCount: pixels, price }),
        }
      )
      const { url: checkoutUrl, error: stripeErr } = await res.json()
      if (stripeErr) throw new Error(stripeErr)
      window.location.href = checkoutUrl
    } catch (err) {
      setErrors({ submit: err.message })
      setLoading(false)
      setStatusMsg('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="p-5 border-b border-white/10"
             style={{ background: 'linear-gradient(135deg,#f9731618,#f9731605)', borderTop: '3px solid #f97316', borderRadius: '1rem 1rem 0 0' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-1">Tu espacio en el muro</div>
              <div className="text-white font-extrabold text-xl">{pixels.toLocaleString()} píxeles</div>
              <div className="text-gray-400 text-sm">{w}×{h} px · posición ({x}, {y})</div>
            </div>
            <div className="text-right">
              <div className="text-brand-500 font-extrabold text-2xl">S/{price.toLocaleString()}</div>
              <div className="text-gray-600 text-xs">pago único</div>
            </div>
          </div>
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="p-5 space-y-4">

          {/* Image upload */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Tu imagen / logo *</label>
            <div onClick={() => fileRef.current?.click()}
                 className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${errors.image ? 'border-red-500/50' : 'border-gray-700 hover:border-brand-500/50'}`}>
              {imagePreview
                ? <img src={imagePreview} alt="" className="h-24 mx-auto rounded-lg object-contain" />
                : <>
                    <div className="text-3xl mb-2">🖼️</div>
                    <p className="text-gray-400 text-sm font-medium">Clic para subir JPG/PNG</p>
                    <p className="text-gray-600 text-xs mt-1">Máximo 5 MB</p>
                  </>}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </div>
            {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image}</p>}
          </div>

          {/* URL */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">URL de destino (opcional)</label>
            <input type="url" value={url} placeholder="https://tu-web.com"
                   onChange={e => setUrl(e.target.value)}
                   className="w-full bg-gray-800 border border-gray-700 focus:border-brand-500 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors" />
          </div>

          {/* Email */}
          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Tu email (para el recibo) *</label>
            <input type="email" value={email} placeholder="tu@email.com"
                   onChange={e => setEmail(e.target.value)}
                   className={`w-full bg-gray-800 border rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${errors.email ? 'border-red-500/50' : 'border-gray-700 focus:border-brand-500'}`} />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
          </div>

          {errors.submit && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">{errors.submit}</div>
          )}

          <button onClick={handlePay} disabled={loading}
                  className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/20 mt-2">
            {loading ? (statusMsg || 'Procesando...') : `Pagar S/${price.toLocaleString()} →`}
          </button>

          <p className="text-gray-600 text-xs text-center">Pago seguro via Stripe · Tu imagen aparece en el muro</p>
        </div>
      </div>
    </div>
  )
}
