import { useState, useRef } from 'react'
import { TIERS, createCheckoutSession } from '../services/stripe'
import { uploadSpaceImage } from '../services/storage'
import { createPurchase } from '../services/database'

const CATEGORIES = ['Restaurante', 'Boutique', 'Salud', 'Educación', 'Tecnología', 'Arte', 'Servicios', 'Otro']
const MAX_DESC = 50

const STEPS = ['Elige tu plan', 'Tu negocio', 'Confirmar y pagar']

function StepIndicator({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className={`flex items-center gap-2 text-sm ${i <= current ? 'text-white' : 'text-gray-600'}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border transition-colors ${
              i < current  ? 'bg-brand-500 border-brand-500 text-white' :
              i === current ? 'border-brand-500 text-brand-500' :
                             'border-gray-700 text-gray-600'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="hidden sm:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-8 h-px ${i < current ? 'bg-brand-500' : 'bg-gray-700'}`} />}
        </div>
      ))}
    </div>
  )
}

function TierCard({ tier, selected, onSelect }) {
  const t = TIERS[tier]
  return (
    <button
      onClick={() => onSelect(tier)}
      className={`relative w-full text-left rounded-xl p-4 border transition-all ${
        selected
          ? 'border-brand-500 bg-brand-500/10 shadow-lg shadow-brand-500/20'
          : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
      }`}
    >
      {t.badge && (
        <span className="absolute -top-2 right-3 bg-brand-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          {t.badge}
        </span>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold text-white">{t.name}</span>
        <span className="font-extrabold text-brand-500">S/{t.price}</span>
      </div>
      <div className="text-gray-500 text-xs mb-2">Tamaño: {t.size} celdas</div>
      <ul className="space-y-1">
        {t.features.map(f => (
          <li key={f} className="text-gray-400 text-xs flex items-center gap-1.5">
            <span className="text-green-500">✓</span> {f}
          </li>
        ))}
      </ul>
    </button>
  )
}

export default function PurchaseFlow({ space, onClose }) {
  const [step, setStep]         = useState(0)
  const [tier, setTier]         = useState('premium')
  const [form, setForm]         = useState({
    businessName: '', email: '', whatsapp: '', category: '', description: '', destinationLink: '',
  })
  const [imageFile, setImageFile]   = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [errors, setErrors]     = useState({})
  const [loading, setLoading]   = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileRef = useRef()

  // ── Escape key ────────────────────────────────────────────────────────────
  const handleEscape = e => { if (e.key === 'Escape') onClose() }
  if (typeof window !== 'undefined') {
    window.onkeydown = handleEscape
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validateStep1() {
    return tier ? {} : { tier: 'Selecciona un plan' }
  }

  function validateStep2() {
    const errs = {}
    if (!form.businessName.trim()) errs.businessName = 'Requerido'
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Email inválido'
    if (!form.whatsapp.match(/^\+?[0-9]{9,15}$/)) errs.whatsapp = 'Número inválido (ej: 999999999)'
    if (!form.category) errs.category = 'Selecciona una categoría'
    if (!imageFile) errs.image = 'Sube tu logo o imagen'
    if (form.description.length > MAX_DESC) errs.description = `Máximo ${MAX_DESC} caracteres`
    if (form.destinationLink && !form.destinationLink.match(/^(https?:\/\/|wa\.me\/)/) &&
        !form.destinationLink.startsWith('instagram.com') &&
        !form.destinationLink.startsWith('www.')) {
      errs.destinationLink = 'Ingresa una URL válida o link de WhatsApp/Instagram'
    }
    return errs
  }

  function next() {
    const errs = step === 0 ? validateStep1() : step === 1 ? validateStep2() : {}
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setStep(s => s + 1)
  }

  // ── Image picker ──────────────────────────────────────────────────────────
  function handleImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setErrors(v => ({ ...v, image: 'Máximo 5 MB' })); return }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setErrors(v => { const c = { ...v }; delete c.image; return c })
  }

  // ── Submit → Stripe ───────────────────────────────────────────────────────
  async function handlePay() {
    setLoading(true)
    try {
      setUploadProgress('Subiendo imagen...')
      const imageUrl = await uploadSpaceImage(imageFile)

      setUploadProgress('Creando tu compra...')
      const purchase = await createPurchase({
        space_id:         space?.id ?? null,
        email:            form.email,
        whatsapp:         form.whatsapp,
        business_name:    form.businessName,
        category:         form.category,
        image_url:        imageUrl,
        destination_link: form.destinationLink,
        description:      form.description,
        amount:           TIERS[tier].price,
        currency:         'PEN',
        status:           'pending',
        tier,
      })

      setUploadProgress('Redirigiendo a pago...')
      const { url } = await createCheckoutSession({
        spaceId:    space?.id,
        tier,
        email:      form.email,
        purchaseId: purchase.id,
      })
      window.location.href = url
    } catch (err) {
      setErrors({ submit: err.message })
      setLoading(false)
      setUploadProgress('')
    }
  }

  const t = TIERS[tier]

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 backdrop-blur-sm p-4 pt-8"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl animate-fade-in mb-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">Compra tu espacio</h2>
            {space?.grid_position && (
              <p className="text-gray-500 text-sm">Posición {space.grid_position}</p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5">✕</button>
        </div>

        <div className="p-6">
          <StepIndicator current={step} />

          {/* ── STEP 1: Plan selection ── */}
          {step === 0 && (
            <div className="space-y-3 animate-fade-in">
              {Object.keys(TIERS).map(k => (
                <TierCard key={k} tier={k} selected={tier === k} onSelect={setTier} />
              ))}
              {errors.tier && <p className="text-red-400 text-sm">{errors.tier}</p>}
            </div>
          )}

          {/* ── STEP 2: Business form ── */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <Field label="Nombre del negocio *" error={errors.businessName}>
                <input
                  type="text"
                  value={form.businessName}
                  onChange={e => setForm(v => ({ ...v, businessName: e.target.value }))}
                  placeholder="Ej: Café Barranco"
                  className={inputClass(errors.businessName)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Email *" error={errors.email}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(v => ({ ...v, email: e.target.value }))}
                    placeholder="tu@email.com"
                    className={inputClass(errors.email)}
                  />
                </Field>
                <Field label="WhatsApp *" error={errors.whatsapp}>
                  <input
                    type="tel"
                    value={form.whatsapp}
                    onChange={e => setForm(v => ({ ...v, whatsapp: e.target.value }))}
                    placeholder="999999999"
                    className={inputClass(errors.whatsapp)}
                  />
                </Field>
              </div>

              <Field label="Categoría *" error={errors.category}>
                <select
                  value={form.category}
                  onChange={e => setForm(v => ({ ...v, category: e.target.value }))}
                  className={inputClass(errors.category)}
                >
                  <option value="" className="bg-gray-900">Selecciona...</option>
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                </select>
              </Field>

              {/* Image upload */}
              <Field label="Logo / Imagen *" error={errors.image}>
                <div
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    errors.image ? 'border-red-500/50' : 'border-gray-700 hover:border-brand-500/50'
                  }`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="h-24 mx-auto rounded-lg object-cover" />
                  ) : (
                    <>
                      <div className="text-3xl mb-1">📸</div>
                      <p className="text-gray-400 text-sm">Haz clic para subir (máx 5MB)</p>
                      <p className="text-gray-600 text-xs mt-1">JPG, PNG, WebP, GIF</p>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </div>
                {imagePreview && (
                  <button onClick={() => { setImageFile(null); setImagePreview(null) }}
                          className="text-gray-500 hover:text-red-400 text-xs mt-1 transition-colors">
                    Cambiar imagen
                  </button>
                )}
              </Field>

              <Field label={`Descripción (${form.description.length}/${MAX_DESC})`} error={errors.description}>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(v => ({ ...v, description: e.target.value.slice(0, MAX_DESC) }))}
                  placeholder="Ej: El mejor café de Barranco"
                  className={inputClass(errors.description)}
                />
              </Field>

              <Field label="Link de destino" error={errors.destinationLink}>
                <input
                  type="url"
                  value={form.destinationLink}
                  onChange={e => setForm(v => ({ ...v, destinationLink: e.target.value }))}
                  placeholder="https://tu-web.com o wa.me/51999..."
                  className={inputClass(errors.destinationLink)}
                />
              </Field>
            </div>
          )}

          {/* ── STEP 3: Review & Pay ── */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="bg-gray-800/50 rounded-xl p-4 mb-6 space-y-3">
                <Row label="Plan" value={<span className="text-brand-500 font-bold">{t.name}</span>} />
                <Row label="Negocio" value={form.businessName} />
                <Row label="Email" value={form.email} />
                <Row label="WhatsApp" value={form.whatsapp} />
                <Row label="Categoría" value={form.category} />
                {form.description && <Row label="Descripción" value={form.description} />}
                {imagePreview && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 text-sm">Imagen</span>
                    <img src={imagePreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  </div>
                )}
                <div className="border-t border-white/10 pt-3 flex justify-between">
                  <span className="text-white font-semibold">Total a pagar</span>
                  <span className="text-brand-500 font-extrabold text-lg">S/{t.price}</span>
                </div>
              </div>

              {errors.submit && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                  {errors.submit}
                </div>
              )}

              <button
                onClick={handlePay}
                disabled={loading}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/30"
              >
                {loading ? uploadProgress || 'Procesando...' : `Pagar S/${t.price} →`}
              </button>
              <p className="text-gray-600 text-xs text-center mt-3">
                Pago seguro via Stripe · Tu espacio queda reservado al pagar
              </p>
            </div>
          )}

          {/* Navigation buttons */}
          {step < 2 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 border border-gray-700 text-gray-400 hover:text-white font-medium py-3 rounded-xl transition-colors"
                >
                  ← Atrás
                </button>
              )}
              <button
                onClick={next}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors"
              >
                {step === 1 ? 'Revisar pedido →' : 'Continuar →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function inputClass(error) {
  return `w-full bg-gray-800 border rounded-xl px-3 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none transition-colors ${
    error ? 'border-red-500/50 focus:border-red-500' : 'border-gray-700 focus:border-brand-500'
  }`
}

function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-gray-400 text-xs font-medium mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between items-start gap-4">
      <span className="text-gray-500 text-sm shrink-0">{label}</span>
      <span className="text-gray-300 text-sm text-right">{value}</span>
    </div>
  )
}
