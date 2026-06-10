import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 inset-x-0 z-40 bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-900">
      <div className="max-w-5xl mx-auto px-4 flex items-center justify-between h-14">

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center font-black text-white text-xs tracking-tight">
            M
          </div>
          <span className="font-semibold text-white text-sm">Muro del Millón</span>
        </Link>

        <nav className="flex items-center gap-1">
          <a href="#faq"
             className="text-zinc-500 hover:text-zinc-200 text-sm px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-all">
            FAQ
          </a>
          <a href="https://wa.me/51999999999" target="_blank" rel="noreferrer"
             className="text-zinc-500 hover:text-zinc-200 text-sm px-3 py-1.5 rounded-lg hover:bg-zinc-900 transition-all">
            WhatsApp
          </a>
          <Link to="/"
            onClick={e => { e.preventDefault(); document.getElementById('muro-section')?.scrollIntoView({ behavior: 'smooth' }) }}
            className="ml-2 bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition-colors">
            Comprar
          </Link>
        </nav>

      </div>
    </header>
  )
}
