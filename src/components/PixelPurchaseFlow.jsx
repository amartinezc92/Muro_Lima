import { useState, useRef } from 'react'
import { uploadSpaceImage } from '../services/storage'
import { supabase } from '../lib/supabase'

const CATEGORIES = ['Restaurante', 'Boutique', 'Salud', 'Educación', 'Tecnología', 'Arte', 'Servicios', 'Otro']
const MAX_DESC   = 50
const PX_PRICE   = 1   // S/1 per pixel
const BLOCK      = 10  // minimum block size

// Predefined sizes (in blocks of 10px)
const SIZES = [
  { label: '10×10',   w: 10,  h: 10,  desc: 'Mini · 100 px' },
  { label: '20×20',   w: 20,  h: 20,  desc: 'Pequeño · 400 px' },
  { label: '30×30',   w: 30,  h: 30,  desc: 'Mediano · 900 px' },
  { label: '50×50',   w: 50,  h: 50,  desc: 'Grande · 2,500 px' },
  { label: '100×100', w: 100, h: 100, desc: 'Mega · 10,000 px' },
]

const STEPS = ['Tu área', 'Tu negocio', 'Confirmar']

function StepDots({ current }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs ${i <= current ? 'text-white' : 'text-gray-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
              i < current  ? 'bg-brand-500 border-brand-500 text-white' :
              i === current ? 'border-brand-500 text-brand-500' :
                             'border-gray-700 text-gray-600'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="hidden sm:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-6 h-px ${i < current ? 'bg-brand-500' : 'bg-gray-700'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function PixelPurchaseFlow({ selectedBlock, onClose, onSuccess }) {
  const [step, setStep]   = useState(0)
  const [size, setSize]   = useState(SIZES[0])
  const [form, setForm]   = useState({ businessName: '', email: '', whatsapp: '', category: '', description: '', destinationLink: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [status, setStatus]   = useState('')
  const fileRef = useRef()

  const pixelCount = size.w * size.h
  const price      = pixelCount * PX_PRICE

  function validate0() {
    return size ? {} : { size: 'Selecciona un tamaño' }
  }
  function validate1() {
    const e = {}
    if (!form.businessName.trim()) e.businessName = 'Requerido'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Email inválido'
    if (!form.whatsapp.match(/^\+?[0-9]{9,15}$/)) e.whatsapp = 'Ej: 999999999'
    if (!form.category) e.category = 'Selecciona categoría'
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
      setStatus('Subiendo imagen...')
      const imageUrl = await uploadSpaceImage(imageFile)

      setStatus('Reservando tu espacio...')
      // Insert space as pending
      const { data: space, error: spaceErr } = await supabase
        .from('spaces')
        .insert({
          block_x:           selectedBlock.bx,
          block_y:           selectedBlock.by,
          block_w:           size.w,
          block_h:           size.h,
          status:            'pending',
          business_name:     form.businessName,
          business_category: form.category,
          image_url:         imageUrl,
          description:       form.description,
          destination_link:  form.destinationLink,
          amount:            price,
        })
        .select()
        .single()

      if (spaceErr) throw new Error(spaceErr.message)

      // Insert purchase record
      const { data: purchase, error: purchaseErr } = await supabase
        .from('purchases')
        .insert({
          space_id:         space.id,
          block_x:          selectedBlock.bx,
          block_y:          selectedBlock.by,
          block_w:          size.w,
          block_h:          size.h,
          pixel_count:      pixelCount,
          email:            form.email,
          whatsapp:         form.whatsapp,
          business_name:    form.businessName,
          category:         form.category,
          image_url:        imageUrl,
          destination_link: form.destinationLink,
          description:      form.description,
          amount:           price,
          currency:         'PEN',
          tier:             'custom',
          status:           'pending',
        })
        .select()
        .single()

      if (purchaseErr) throw new Error(purchaseErr.message)

      setStatus('Redirigiendo a pago...')
      // Call Edge Function for Stripe checkout
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spaceId:    space.id,
            tier:       'custom',
            email:      form.email,
            purchaseId: purchase.id,
            pixelCount,
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
      setStatus('')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-6"
         onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Compra tus píxeles</h2>
            <p className="text-gray-500 text-xs">Posición ({selectedBlock?.bx}, {selectedBlock?.by}) · S/1 por píxel</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="p-5">
          <StepDots current={step} />

          {/* ── STEP 0: Size picker ── */}
          {step === 0 && (
            <div className="space-y-3 animate-fade-in">
              <p className="text-gray-400 text-sm mb-4">¿Cuántos píxeles quieres comprar? Cada píxel = <span className="text-brand-500 font-bold">S/1</span></p>
              {SIZES.map(s => (
                <button
                  key={s.label}
                  onClick={() => setSize(s)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                    size.label === s.label
                      ? 'border-brand-500 bg-brand-500/10'
                      : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                  }`}
                >
                  <div className="text-left">
                    <div className="text-white font-bold">{s.label} px</div>
                    <div className="text-gray-500 text-xs">{s.desc}</div>
                  </div>
                  <div className="text-brand-500 font-extrabold text-lg">
                    S/{(s.w * s.h * PX_PRICE).toLocaleString()}
                  </div>
                </button>
              ))}

              {/* Visual preview */}
              <div className="bg-gray-800/50 rounded-xl p-3 mt-2">
                <p className="text-gray-500 text-xs mb-2">Vista previa de tu área en la grilla:</p>
                <div className="flex items-center justify-center">
                  <div
                    className="bg-brand-500/40 border-2 border-brand-500 rounded-sm"
                    style={{
                      width:  Math.min(size.w * 2, 100),
                      height: Math.min(size.h * 2, 100),
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 1: Business form ── */}
          {step === 1 && (
            <div className="space-y-3 animate-fade-in">
              <Field label="Nombre del negocio *" error={errors.businessName}>
                <input type="text" value={form.businessName}
                       onChange={e => setForm(v => ({ ...v, businessName: e.target.value }))}
                       placeholder="Ej: Café Barranco" className={ic(errors.businessName)} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Email *" error={errors.email}>
                  <input type="email" value={form.email}
                         onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                         placeholder="tu@email.com" className={ic(errors.email)} />
                </Field>
                <Field label="WhatsApp *" error={errors.whatsapp}>
                  <input type="tel" value={form.whatsapp}
                         onChange={e => setForm(v => ({ ...v, whatsapp: e.target.value }))}
                         placeholder="999999999" className={ic(errors.whatsapp)} />
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
                    ? <img src={imagePreview} alt="" className="h-20 mx-auto rounded-lg object-cover" />
                    : <><div className="text-2xl mb-1">📸</div><p className="text-gray-400 text-sm">Haz clic para subir (máx 5MB)</p></>
                  }
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>
              </Field>
              <Field label={`Descripción (${form.description.length}/${MAX_DESC})`} error={errors.description}>
                <input type="text" value={form.description}
                       onChange={e => setForm(v => ({ ...v, description: e.target.value.slice(0, MAX_DESC) }))}
                       placeholder="Ej: El mejor café de Barranco" className={ic(errors.description)} />
              </Field>
              <Field label="Link de destino" error={errors.destinationLink}>
                <input type="text" value={form.destinationLink}
                       onChange={e => setForm(v => ({ ...v, destinationLink: e.target.value }))}
                       placeholder="https://tu-web.com o wa.me/51999..." className={ic(errors.destinationLink)} />
              </Field>
            </div>
          )}

          {/* ── STEP 2: Review & Pay ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="bg-gray-800/50 rounded-xl p-4 mb-5 space-y-2.5">
                <Row label="Área" value={`${size.label} px (${pixelCount.toLocaleString()} píxeles)`} />
                <Row label="Posición" value={`(${selectedBlock?.bx}, ${selectedBlock?.by})`} />
                <Row label="Negocio" value={form.businessName} />
                <Row label="Email" value={form.email} />
                <Row label="WhatsApp" value={form.whatsapp} />
                <Row label="Categoría" value={form.category} />
                {imagePreview && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Imagen</span>
                    <img src={imagePreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between items-center">
                  <span className="text-white font-semibold">Total</span>
                  <div className="text-right">
                    <div className="text-brand-500 font-extrabold text-xl">S/{price.toLocaleString()}</div>
                    <div className="text-gray-600 text-xs">{pixelCount.toLocaleString()} píxeles × S/1</div>
                  </div>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                  {errors.submit}
                </div>
              )}

              <button onClick={handlePay} disabled={loading}
                      className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/30">
                {loading ? (status || 'Procesando...') : `Pagar S/${price.toLocaleString()} →`}
              </button>
              <p className="text-gray-600 text-xs text-center mt-3">Pago seguro via Stripe · Tu espacio queda reservado</p>
            </div>
          )}

          {/* Navigation */}
          {step < 2 && (
            <div className="flex gap-3 mt-5">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                        className="flex-1 border border-gray-700 text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-colors">
                  ← Atrás
                </button>
              )}
              <button onClick={next}
                      className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors">
                {step === 1 ? 'Revisar →' : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ic = err => `w-full bg-gray-800 border rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${err ? 'border-red-500/50' : 'border-gray-700 focus:border-brand-500'}`
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
