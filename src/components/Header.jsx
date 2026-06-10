import { Link, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center font-bold text-white text-sm">ML</div>
          <span className="font-bold text-white text-lg hidden sm:block">Muro de Lima</span>
        </Link>

        <nav className="flex items-center gap-6 text-sm text-gray-400">
          {pathname !== '/' && (
            <Link to="/" className="hover:text-white transition-colors">Inicio</Link>
          )}
          <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          <a href="https://wa.me/51999999999" target="_blank" rel="noreferrer"
             className="hover:text-white transition-colors">WhatsApp</a>
          <Link
            to="/"
            onClick={e => {
              e.preventDefault()
              document.getElementById('grid-section')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Compra tu espacio
          </Link>
        </nav>
      </div>
    </header>
  )
}
