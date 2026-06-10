import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { fetchUserByEmail, updateSpace } from '../services/database'

export default function Dashboard() {
  const [email, setEmail]       = useState('')
  const [userData, setUserData] = useState(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [newLink, setNewLink]   = useState('')
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const user = await fetchUserByEmail(email.toLowerCase().trim())
      setUserData(user)
      setNewLink(user.spaces?.destination_link ?? '')
    } catch {
      setError('No encontramos una cuenta con ese email. ¿Ya compraste tu espacio?')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveLink(e) {
    e.preventDefault()
    if (!newLink.trim()) return
    setSaving(true)
    try {
      await updateSpace(userData.space_id, { destination_link: newLink.trim() })
      setUserData(v => ({ ...v, spaces: { ...v.spaces, destination_link: newLink.trim() } }))
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Error al guardar. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  function handleLogout() {
    setUserData(null)
    setEmail('')
    setNewLink('')
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm animate-fade-in">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center mx-auto mb-3 text-2xl">📊</div>
            <h1 className="text-xl font-bold text-white">Mi Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Ingresa con el email que usaste al comprar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              required
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Buscando...' : 'Acceder →'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const space = userData.spaces
  const expiresAt = space?.expires_at ? new Date(space.expires_at).toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'

  return (
    <div className="min-h-screen bg-gray-950 py-12 px-4">
      <div className="max-w-2xl mx-auto animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{userData.business_name || 'Mi negocio'}</h1>
            <p className="text-gray-500 text-sm">{userData.email}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-white text-sm transition-colors">Salir</button>
        </div>

        {/* Space preview */}
        {space && (
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-semibold mb-4">Tu espacio en la grilla</h2>
            <div className="flex items-center gap-4">
              {space.image_url && (
                <img src={space.image_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-white/10" />
              )}
              <div>
                <div className="text-gray-400 text-sm">Posición: <span className="text-white font-mono font-bold">{space.grid_position}</span></div>
                <div className="text-gray-400 text-sm mt-1">Plan: <span className="text-brand-500 font-semibold capitalize">{space.tier}</span></div>
                <div className="text-gray-400 text-sm mt-1">Estado:
                  <span className={`ml-1 font-semibold ${space.status === 'sold' ? 'text-green-400' : 'text-yellow-400'}`}>
                    {space.status === 'sold' ? '✓ Activo' : '⏳ En revisión'}
                  </span>
                </div>
                <div className="text-gray-400 text-sm mt-1">Vence: <span className="text-white">{expiresAt}</span></div>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {[
            { label: 'Vistas este mes', value: space?.views ?? 0, icon: '👁️' },
            { label: 'Clicks este mes',  value: space?.clicks ?? 0, icon: '🖱️' },
          ].map(stat => (
            <div key={stat.label} className="bg-gray-900 border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-3xl font-extrabold text-white">{stat.value.toLocaleString()}</div>
              <div className="text-gray-500 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Edit link */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">Editar enlace de destino</h2>
          <form onSubmit={handleSaveLink} className="flex gap-3">
            <input
              type="text"
              value={newLink}
              onChange={e => setNewLink(e.target.value)}
              placeholder="https://tu-web.com o wa.me/51999..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-brand-500 transition-colors"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              {saving ? '...' : saved ? '✓ Guardado' : 'Guardar'}
            </button>
          </form>
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          <p className="text-gray-600 text-xs mt-3">
            El link actualiza en minutos. Puede ser URL, Instagram o WhatsApp.
          </p>
        </div>
      </div>
    </div>
  )
}
