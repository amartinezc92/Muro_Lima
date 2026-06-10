export default function Footer() {
  return (
    <footer className="bg-[#09090b] border-t border-zinc-900 py-12 px-4">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">

        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-orange-500 flex items-center justify-center font-black text-white text-xs">M</div>
          <span className="text-zinc-500 text-sm">Muro del Millón · Lima, Perú</span>
        </div>

        <div className="flex items-center gap-6 text-zinc-600 text-sm">
          <a href="mailto:hola@murodelmillon.com" className="hover:text-zinc-300 transition-colors">hola@murodelmillon.com</a>
          <a href="https://wa.me/51999999999" target="_blank" rel="noreferrer" className="hover:text-zinc-300 transition-colors">WhatsApp</a>
        </div>

        <span className="text-zinc-800 text-xs">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  )
}
