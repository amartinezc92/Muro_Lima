import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { uploadSpaceImage } from '../services/storage'

const CATEGORIES = ['Restaurante', 'Boutique', 'Salud', 'Educación', 'Tecnología', 'Arte', 'Servicios', 'Otro']

// Block sizes: width x height in pixels (min 10x10)
const BLOCKS = [
  { label: '10×10',   w: 10,  h: 10,  desc: 'Micro' },
  { label: '20×20',   w: 20,  h: 20,  desc: 'Pequeño' },
  { label: '50×20',   w: 50,  h: 20,  desc: 'Banner' },
  { label: '50×50',   w: 50,  h: 50,  desc: 'Cuadrado' },
  { label: '100×50',  w: 100, h: 50,  desc: 'Destacado' },
  { label: '100×100', w: 100, h: 100, desc: 'Premium' },
  { label: '200×100', w: 200, h: 100, desc: 'Grande' },
]

export default function BuyModal({ position, onClose, onSuccess }) {
  const [step, setStep]   = useState(0)
  const [block, setBlock] = useState(BLOCKS[3])
  const [form, setForm]   = useState({ businessName: '', email: '', whatsapp: '', category: '', description: '', destinationLink: '' })
  const [imageFile, setImageFile]     = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading]   = useState(false)
  const [statusMsg, setStatusMsg] = useState('')
  const fileRef = useRef()

  if (!position) return null

  const pixels = block.w * block.h
  const price  = pixels  // S/1 per pixel

  function validate0() { return {} }
  function validate1() {
    const e = {}
    if (!form.businessName.trim()) e.businessName = 'Requerido'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido'
    if (!form.whatsapp.match(/^\+?[0-9]{9,15}$/)) e.whatsapp = 'Ej: 999999999'
    if (!form.category) e.category = 'Categoría requerida'
    if (!imageFile) e.image = 'Sube tu logo o imagen'
    return e
  }

  function next() {
    const errs = step === 0 ? validate0() : step === 1 ? validate1() : {}
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
  }

  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(v => ({ ...v, image: 'Máximo 5 MB' })); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(v => { const c = { ...v }; delete c.image; return c })
  }

  async function handlePay() {
    setLoading(true)
    try {
      setStatusMsg('Subiendo imagen...')
      const imageUrl = await uploadSpaceImage(imageFile)

      setStatusMsg('Registrando tu espacio...')
      const { data: purchase, error: pErr } = await supabase
        .from('purchases')
        .insert({
          email:            form.email,
          whatsapp:         form.whatsapp,
          business_name:    form.businessName,
          category:         form.category,
          image_url:        imageUrl,
          destination_link: form.destinationLink,
          description:      form.description,
          pixel_count:      pixels,
          px:               position.x,
          py:               position.y,
          pw:               block.w,
          ph:               block.h,
          amount:           price,
          currency:         'PEN',
          status:           'pending',
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
          body: JSON.stringify({
            email:      form.email,
            purchaseId: purchase.id,
            pixelCount: pixels,
            price,
          }),
        }
      )
      const { url, error: stripeErr } = await res.json()
      if (stripeErr) throw new Error(stripeErr)
      window.location.href = url
    } catch (err) {
      setErrors({ submit: err.message })
      setLoading(false)
      setStatusMsg('')
    }
  }

  const STEPS = ['Elige tamaño', 'Tu negocio', 'Confirmar']
  const ic = err => `w-full bg-gray-800 border rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${err ? 'border-red-500/50' : 'border-gray-700 focus:border-brand-500'}`

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-8"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in mb-8">

        {/* Header */}
        <div className="rounded-t-2xl p-5 border-b border-white/10"
             style={{ background: 'linear-gradient(135deg,#f9731622,#f9731608)', borderTop: '3px solid #f97316' }}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-1 text-brand-500">
                Posición ({position.x}, {position.y})
              </div>
              <h2 className="text-lg font-bold text-white">Reserva tu espacio en el muro</h2>
              <p className="text-gray-500 text-xs mt-1">S/1 por píxel · pago único · visible para siempre</p>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
          </div>
        </div>

        <div className="p-5">
          {/* Steps */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 text-xs ${i <= step ? 'text-white' : 'text-gray-600'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                    i < step  ? 'bg-brand-500 border-brand-500 text-white' :
                    i === step ? 'border-brand-500 text-brand-500' :
                    'border-gray-700 text-gray-600'
                  }`}>{i < step ? '✓' : i + 1}</div>
                  <span className="hidden sm:block">{label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < step ? 'bg-brand-500' : 'bg-gray-700'}`} />}
              </div>
            ))}
          </div>

          {/* Step 0: block size */}
          {step === 0 && (
            <div className="space-y-2 animate-fade-in">
              <p className="text-gray-500 text-xs mb-3">Elige el tamaño de tu espacio:</p>
              {BLOCKS.map(b => (
                <button key={b.label} onClick={() => setBlock(b)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                          block.label === b.label
                            ? 'border-brand-500 bg-brand-500/10'
                            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                        }`}>
                  <div className="flex items-center gap-3">
                    {/* Mini preview */}
                    <div className="bg-brand-500/20 border border-brand-500/40 rounded flex-shrink-0"
                         style={{ width: Math.min(b.w / 2, 48) + 'px', height: Math.min(b.h / 2, 32) + 'px' }} />
                    <div className="text-left">
                      <div className="text-white font-bold text-sm">{b.label} px</div>
                      <div className="text-gray-500 text-xs">{b.desc} · {(b.w * b.h).toLocaleString()} píxeles</div>
                    </div>
                  </div>
                  <div className="text-brand-500 font-extrabold">S/{(b.w * b.h).toLocaleString()}</div>
                </button>
              ))}
            </div>
          )}

          {/* Step 1: business form */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <Field label="Nombre del negocio *" error={errors.businessName}>
                <input type="text" value={form.businessName} placeholder="Ej: Café Barranco"
                       onChange={e => setForm(v => ({ ...v, businessName: e.target.value }))}
                       className={ic(errors.businessName)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email *" error={errors.email}>
                  <input type="email" value={form.email} placeholder="tu@email.com"
                         onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                         className={ic(errors.email)} />
                </Field>
                <Field label="WhatsApp *" error={errors.whatsapp}>
                  <input type="tel" value={form.whatsapp} placeholder="999999999"
                         onChange={e => setForm(v => ({ ...v, whatsapp: e.target.value }))}
                         className={ic(errors.whatsapp)} />
                </Field>
              </div>
              <Field label="Categoría *" error={errors.category}>
                <select value={form.category} onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                        className={ic(errors.category)}>
                  <option value="" className="bg-gray-900">Selecciona...</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
              </Field>
              <Field label="Logo / Imagen *" error={errors.image}>
                <div onClick={() => fileRef.current?.click()}
                     className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${errors.image ? 'border-red-500/50' : 'border-gray-700 hover:border-brand-500/50'}`}>
                  {imagePreview
                    ? <img src={imagePreview} alt="" className="h-20 mx-auto rounded-lg object-contain" />
                    : <><div className="text-2xl mb-1">📸</div><p className="text-gray-400 text-sm">Clic para subir logo (máx 5MB)</p></>}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>
              </Field>
              <Field label="Descripción (opcional)">
                <input type="text" value={form.description} placeholder="Ej: El mejor café de Lima"
                       onChange={e => setForm(v => ({ ...v, description: e.target.value.slice(0, 50) }))}
                       className={ic()} />
              </Field>
              <Field label="Link de destino (opcional)">
                <input type="text" value={form.destinationLink} placeholder="https://tu-web.com"
                       onChange={e => setForm(v => ({ ...v, destinationLink: e.target.value }))}
                       className={ic()} />
              </Field>
            </div>
          )}

          {/* Step 2: confirm */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="bg-gray-800/50 rounded-xl p-4 mb-5 space-y-2">
                <Row label="Posición" value={`(${position.x}, ${position.y})`} />
                <Row label="Tamaño" value={`${block.label} px = ${pixels.toLocaleString()} píxeles`} />
                <Row label="Negocio" value={form.businessName} />
                <Row label="Email" value={form.email} />
                {imagePreview && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Imagen</span>
                    <img src={imagePreview} alt="" className="h-10 w-16 rounded-lg object-contain bg-gray-700" />
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-semibold">Total</span>
                  <div className="text-right">
                    <div className="font-extrabold text-xl text-brand-500">S/{price.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">{pixels.toLocaleString()} px × S/1</div>
                  </div>
                </div>
              </div>
              {errors.submit && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">{errors.submit}</div>
              )}
              <button onClick={handlePay} disabled={loading}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg disabled:opacity-60">
                {loading ? (statusMsg || 'Procesando...') : `Pagar S/${price.toLocaleString()} →`}
              </button>
              <p className="text-gray-600 text-xs text-center mt-3">Pago seguro via Stripe · Tu logo aparece en el muro</p>
            </div>
          )}

          {step < 2 && (
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                        className="flex-1 border border-gray-700 text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-colors">
                  ← Atrás
                </button>
              )}
              <button onClick={next} className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors">
                {step === 1 ? 'Revisar →' : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const Field = ({ label, error, children }) => (
  <div>
    <label className="block text-gray-400 text-xs font-medium mb-1">{label}</label>
    {children}
    {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
  </div>
)
const Row = ({ label, value }) => (
  <div className="flex justify-between items-start gap-4">
    <span className="text-gray-500 text-sm shrink-0">{label}</span>
    <span className="text-gray-300 text-sm text-right">{value}</span>
  </div>
)
