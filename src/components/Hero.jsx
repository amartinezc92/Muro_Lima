export default function Hero({ onCTA }) {
  return (
    <section className="relative min-h-[92vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden bg-[#09090b]">

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-orange-500/8 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center gap-6">

        {/* Live badge */}
        <div className="animate-fade-up inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 backdrop-blur text-zinc-400 text-xs font-medium px-3.5 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          1,000,000 píxeles disponibles
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-100 text-5xl sm:text-7xl font-black text-white leading-[1.05] tracking-tight">
          El Muro<br />
          <span className="text-orange-500">del Millón</span>
        </h1>

        {/* Subheadline */}
        <p className="animate-fade-up delay-200 text-zinc-400 text-lg sm:text-xl leading-relaxed max-w-md">
          Compra los píxeles que quieras. Sube tu imagen. Queda visible para siempre.
        </p>

        {/* CTA */}
        <div className="animate-fade-up delay-300 flex flex-col sm:flex-row items-center gap-3 mt-2">
          <button
            onClick={onCTA}
            className="group relative bg-orange-500 hover:bg-orange-400 text-white font-semibold px-7 py-3.5 rounded-xl text-base transition-all duration-200 shadow-[0_0_0_0_theme(colors.orange.500)] hover:shadow-[0_0_24px_4px_theme(colors.orange.500/30)]"
          >
            Comprar mi espacio
            <span className="ml-2 inline-block transition-transform group-hover:translate-x-0.5">→</span>
          </button>
          <span className="text-zinc-600 text-sm">S/1 por píxel · pago único</span>
        </div>

      </div>

      {/* Scroll hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700 text-xs animate-fade-in">
        <div className="w-px h-10 bg-gradient-to-b from-transparent to-zinc-700" />
        scroll
      </div>
    </section>
  )
}
