import { useState, useEffect } from 'react'

const TESTIMONIALS = [
  {
    name: 'María García',
    business: 'Café Barranco',
    text: 'En dos semanas duplicamos nuestras reservas. El muro nos dio visibilidad que ninguna red social pudo.',
    avatar: 'MG',
  },
  {
    name: 'Carlos Ríos',
    business: 'Studio Miraflores',
    text: 'Pagar una vez y estar visible todo el año es increíble. Ya recuperé la inversión en el primer mes.',
    avatar: 'CR',
  },
  {
    name: 'Lucía Mendoza',
    business: 'Boutique San Isidro',
    text: 'Mis clientes me dicen que me encontraron en El Muro. Es la mejor inversión que hice para mi boutique.',
    avatar: 'LM',
  },
]

const STATS = [
  { value: '347', label: 'Negocios visibles' },
  { value: '2M+', label: 'Impresiones/mes' },
  { value: '94%', label: 'Renovación' },
]

export default function Hero({ onCTA }) {
  const [testimonialIdx, setTestimonialIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 4000)
    return () => clearInterval(t)
  }, [])

  const t = TESTIMONIALS[testimonialIdx]

  return (
    <section className="relative bg-gradient-to-b from-black via-gray-950 to-gray-900 py-20 px-4 text-center overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-brand-500/10 blur-3xl rounded-full" />
      </div>

      <div className="relative max-w-3xl mx-auto animate-fade-in">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 text-brand-500 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse-slow" />
          Lima · Directorio Visual Interactivo
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
          Tu negocio visible<br />
          <span className="text-brand-500">toda Lima</span> lo ve
        </h1>

        <p className="text-gray-400 text-lg sm:text-xl mb-8 max-w-xl mx-auto">
          El muro digital donde los mejores negocios independientes de Lima compran su espacio
          y millones de personas los descubren. Pago único · 12 meses.
        </p>

        {/* Stats */}
        <div className="flex flex-wrap justify-center gap-8 mb-10">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold text-white">{s.value}</div>
              <div className="text-gray-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14">
          <button
            onClick={onCTA}
            className="bg-brand-500 hover:bg-brand-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-all shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:-translate-y-0.5"
          >
            Compra tu espacio →
          </button>
          <a
            href="#grid-section"
            className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 font-medium px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Ver la grilla
          </a>
        </div>

        {/* Rotating testimonial */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 max-w-md mx-auto transition-all duration-500">
          <p className="text-gray-300 italic mb-4">"{t.text}"</p>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold">
              {t.avatar}
            </div>
            <div className="text-left">
              <div className="text-white text-sm font-semibold">{t.name}</div>
              <div className="text-gray-500 text-xs">{t.business}</div>
            </div>
            <div className="ml-auto flex gap-1">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTestimonialIdx(i)}
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${i === testimonialIdx ? 'bg-brand-500' : 'bg-white/20'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
