export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 mb-1 justify-center sm:justify-start">
              <div className="w-6 h-6 rounded bg-brand-500 flex items-center justify-center text-white text-xs font-bold">ML</div>
              <span className="text-white font-bold">Muro de Lima</span>
            </div>
            <p className="text-gray-600 text-xs">El directorio visual de los negocios independientes de Lima.</p>
          </div>

          <div className="flex gap-6 text-sm text-gray-500">
            <a href="mailto:hola@murodlima.com" className="hover:text-white transition-colors">hola@murodlima.com</a>
            <a href="https://wa.me/51999999999" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
            <a href="https://instagram.com/murodlima" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Instagram</a>
          </div>
        </div>
        <div className="border-t border-white/5 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-gray-700 text-xs">
          <span>© {new Date().getFullYear()} Muro de Lima · Todos los derechos reservados</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-gray-500 transition-colors">Términos</a>
            <a href="#" className="hover:text-gray-500 transition-colors">Privacidad</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
