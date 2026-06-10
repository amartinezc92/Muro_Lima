import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function SuccessPage() {
  const [params] = useSearchParams()
  const email = params.get('email') ?? ''

  useEffect(() => {
    // Confetti-like visual cue: nothing heavy, just the UI
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/50 flex items-center justify-center mx-auto mb-6 text-4xl">
          ✅
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-3">¡Pago exitoso!</h1>
        <p className="text-gray-400 mb-2">
          Tu espacio está en revisión. Nuestro equipo validará tu imagen y enlace en las próximas
          <span className="text-white font-semibold"> 24 horas hábiles</span>.
        </p>
        {email && (
          <p className="text-gray-500 text-sm mb-8">
            Te enviaremos la confirmación a <span className="text-brand-500">{email}</span>
          </p>
        )}

        <div className="bg-gray-800/50 border border-white/10 rounded-2xl p-5 mb-8 text-left space-y-3">
          <h3 className="text-white font-semibold mb-3">Próximos pasos</h3>
          {[
            { n: '1', text: 'Recibe email de confirmación con tu número de pedido' },
            { n: '2', text: 'Nuestro equipo valida imagen y enlace (24h hábiles)' },
            { n: '3', text: '¡Tu negocio aparece en la grilla de Lima!' },
            { n: '4', text: 'Accede a tu dashboard para ver estadísticas' },
          ].map(s => (
            <div key={s.n} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-500 text-xs flex items-center justify-center shrink-0 mt-0.5">
                {s.n}
              </div>
              <p className="text-gray-400 text-sm">{s.text}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/"
                className="bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-6 rounded-xl transition-colors">
            Ver el Muro de Lima
          </Link>
          <a href="https://wa.me/51999999999"
             target="_blank" rel="noreferrer"
             className="border border-white/10 text-gray-400 hover:text-white py-3 px-6 rounded-xl transition-colors text-sm">
            ¿Dudas? Escríbenos por WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
