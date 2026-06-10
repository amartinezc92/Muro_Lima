import { useState } from 'react'

const ITEMS = [
  {
    q: '¿Cuánto cuesta?',
    a: 'S/1 por píxel. Puedes comprar desde 1 píxel. El pago es único: tu imagen queda visible mientras el muro exista.',
  },
  {
    q: '¿Cuándo aparece mi imagen?',
    a: 'Después del pago, tu imagen aparece en el muro en menos de 24 horas hábiles. Recibirás un email de confirmación.',
  },
  {
    q: '¿Puedo elegir dónde quedar en el muro?',
    a: 'Sí. Arrastras en el muro para elegir exactamente qué área quieres. La posición es tuya de por vida.',
  },
  {
    q: '¿Puedo cambiar mi imagen o URL después?',
    a: 'La URL puedes cambiarla cuando quieras. La imagen puede actualizarse una vez por año.',
  },
  {
    q: '¿Qué métodos de pago aceptan?',
    a: 'Tarjeta de crédito/débito, Yape y Plin a través de Stripe. 100% seguro.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(null)

  return (
    <section id="faq" className="bg-[#09090b] py-24 px-4">
      <div className="max-w-xl mx-auto">

        <h2 className="text-2xl font-bold text-white text-center mb-12">Preguntas frecuentes</h2>

        <div className="space-y-px">
          {ITEMS.map((item, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between text-left py-4 text-zinc-300 hover:text-white transition-colors group"
              >
                <span className="text-sm font-medium">{item.q}</span>
                <span className={`text-zinc-600 group-hover:text-zinc-400 transition-all text-lg leading-none ${open === i ? 'rotate-45' : ''} duration-200`}>
                  +
                </span>
              </button>
              {open === i && (
                <p className="pb-5 text-zinc-500 text-sm leading-relaxed animate-fade-up">
                  {item.a}
                </p>
              )}
              {i < ITEMS.length - 1 && <div className="h-px bg-zinc-900" />}
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
