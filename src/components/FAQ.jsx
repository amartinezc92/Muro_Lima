import { useState } from 'react'

const ITEMS = [
  {
    q: '¿Cómo funciona el pago?',
    a: 'Pago único por 12 meses via Stripe (tarjeta, Yape, Plin). Recibes confirmación por email inmediatamente.',
  },
  {
    q: '¿Cuándo aparece mi negocio en la grilla?',
    a: 'Nuestro equipo valida tu imagen y enlace en máximo 24 horas hábiles. Recibirás un email cuando esté activo.',
  },
  {
    q: '¿Puedo cambiar mi imagen o enlace?',
    a: 'Sí. Desde tu dashboard puedes actualizar tu link de destino cuando quieras. La imagen puede cambiarse una vez por semestre.',
  },
  {
    q: '¿Qué pasa si quiero más espacio?',
    a: 'Puedes adquirir hasta 3 espacios consecutivos. Escríbenos por WhatsApp para coordinar una ubicación premium.',
  },
  {
    q: '¿Cuánta gente ve el Muro de Lima?',
    a: 'Actualmente más de 2 millones de impresiones al mes gracias a nuestras campañas en redes, Google y alianzas locales.',
  },
  {
    q: '¿Qué categorías de negocios pueden participar?',
    a: 'Todos los negocios independientes de Lima: restaurantes, boutiques, salud, educación, tech, arte, servicios y más. Sin cadenas.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faq" className="bg-gray-950 py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-extrabold text-white text-center mb-10">Preguntas frecuentes</h2>
        <div className="space-y-3">
          {ITEMS.map((item, i) => (
            <div key={i} className="border border-white/10 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left px-5 py-4 text-white hover:bg-white/5 transition-colors"
              >
                <span className="font-medium text-sm sm:text-base">{item.q}</span>
                <span className={`text-gray-500 transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-gray-400 text-sm leading-relaxed animate-fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
