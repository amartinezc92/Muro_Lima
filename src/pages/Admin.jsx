import { useState, useEffect } from 'react'
import {
  fetchPurchasesByStatus,
  fetchAdminStats,
  updatePurchase,
  updateSpace,
} from '../services/database'

// Hardcoded admin credentials (MVP only — move to env/auth in Fase 2)
const ADMIN_EMAIL    = 'admin@murodlima.com'
const ADMIN_PASSWORD = 'MuroAdmin2024!'

function StatCard({ label, value, sub, color = 'brand' }) {
  const colors = { brand: 'text-brand-500', green: 'text-green-400', yellow: 'text-yellow-400' }
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-4">
      <div className={`text-2xl font-extrabold ${colors[color]}`}>{value}</div>
      <div className="text-gray-400 text-sm mt-0.5">{label}</div>
      {sub && <div className="text-gray-600 text-xs mt-1">{sub}</div>}
    </div>
  )
}

export default function Admin() {
  const [authed, setAuthed]       = useState(false)
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [loginErr, setLoginErr]   = useState('')

  const [purchases, setPurchases] = useState([])
  const [stats, setStats]         = useState(null)
  const [tab, setTab]             = useState('pending') // 'pending' | 'completed' | 'rejected'
  const [loading, setLoading]     = useState(false)
  const [actionId, setActionId]   = useState(null) // purchase being acted on

  function handleLogin(e) {
    e.preventDefault()
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setAuthed(true)
    } else {
      setLoginErr('Credenciales incorrectas')
    }
  }

  async function loadData() {
    setLoading(true)
    const [ps, st] = await Promise.all([
      fetchPurchasesByStatus(tab).catch(() => []),
      fetchAdminStats().catch(() => null),
    ])
    setPurchases(ps)
    setStats(st)
    setLoading(false)
  }

  useEffect(() => {
    if (authed) loadData()
  }, [authed, tab])

  async function handleApprove(purchase) {
    setActionId(purchase.id)
    try {
      await Promise.all([
        updatePurchase(purchase.id, { status: 'completed', updated_at: new Date().toISOString() }),
        updateSpace(purchase.space_id, {
          status:            'sold',
          business_name:     purchase.business_name,
          business_category: purchase.category,
          image_url:         purchase.image_url,
          destination_link:  purchase.destination_link,
          description:       purchase.description,
          tier:              purchase.tier,
          expires_at:        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ])
      await loadData()
    } finally {
      setActionId(null)
    }
  }

  async function handleReject(purchase) {
    if (!confirm(`¿Rechazar compra de ${purchase.business_name}?`)) return
    setActionId(purchase.id)
    try {
      await updatePurchase(purchase.id, { status: 'rejected', updated_at: new Date().toISOString() })
      await loadData()
    } finally {
      setActionId(null)
    }
  }

  // ── Login screen ────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 w-full max-w-sm animate-fade-in">
          <h1 className="text-xl font-bold text-white text-center mb-6">Admin · Muro de Lima</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                   placeholder="Email" required
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                   placeholder="Contraseña" required
                   className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-500" />
            {loginErr && <p className="text-red-400 text-sm">{loginErr}</p>}
            <button type="submit" className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl transition-colors">
              Ingresar →
            </button>
          </form>
        </div>
      </div>
    )
  }

  // ── Admin panel ─────────────────────────────────────────────────────────────
  const occupancy = stats ? Math.round((stats.sold / (stats.total || 300)) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-950 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-white">Panel de Admin</h1>
            <p className="text-gray-500 text-sm">Muro de Lima · MVP</p>
          </div>
          <button onClick={() => setAuthed(false)} className="text-gray-500 hover:text-white text-sm transition-colors">Salir</button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <StatCard label="Ingresos totales" value={`S/${stats.revenue.toLocaleString()}`} color="green" />
            <StatCard label="Espacios vendidos" value={stats.sold} color="brand" />
            <StatCard label="En revisión" value={stats.pending} color="yellow" />
            <StatCard label="Ocupación" value={`${occupancy}%`} sub={`${stats.total} total`} />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {['pending', 'completed', 'rejected'].map(t => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                      tab === t ? 'bg-brand-500 text-white' : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}>
              {t === 'pending' ? '⏳ Pendientes' : t === 'completed' ? '✅ Aprobadas' : '❌ Rechazadas'}
            </button>
          ))}
          <button onClick={loadData} className="ml-auto text-gray-500 hover:text-white text-sm transition-colors">↻ Actualizar</button>
        </div>

        {/* Purchases table */}
        {loading ? (
          <div className="text-center text-gray-500 py-12">Cargando...</div>
        ) : purchases.length === 0 ? (
          <div className="text-center text-gray-600 py-12 border border-dashed border-white/10 rounded-2xl">
            No hay compras {tab === 'pending' ? 'pendientes' : tab}
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map(p => (
              <div key={p.id} className="bg-gray-900 border border-white/10 rounded-2xl p-5 flex flex-col sm:flex-row gap-5">
                {/* Image */}
                <div className="shrink-0">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.business_name}
                         className="w-24 h-24 rounded-xl object-cover border border-white/10" />
                  ) : (
                    <div className="w-24 h-24 rounded-xl bg-gray-800 flex items-center justify-center text-gray-600 text-xs">Sin imagen</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start gap-2 mb-2">
                    <h3 className="text-white font-bold text-lg">{p.business_name}</h3>
                    <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded-full">{p.category}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      p.tier === 'ultra'   ? 'bg-purple-900/40 text-purple-400' :
                      p.tier === 'premium' ? 'bg-brand-900/40 text-brand-400' :
                                            'bg-gray-800 text-gray-400'
                    }`}>{p.tier} · S/{p.amount}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-gray-500 mb-3">
                    <span>📧 {p.email}</span>
                    <span>📱 {p.whatsapp}</span>
                    {p.destination_link && (
                      <span className="col-span-2 truncate">
                        🔗 <a href={p.destination_link} target="_blank" rel="noreferrer"
                              className="text-brand-500 hover:underline">{p.destination_link}</a>
                      </span>
                    )}
                    {p.description && <span className="col-span-2">💬 {p.description}</span>}
                    {p.spaces?.grid_position && <span>📍 Posición: {p.spaces.grid_position}</span>}
                    <span>📅 {new Date(p.created_at).toLocaleDateString('es-PE')}</span>
                  </div>

                  {tab === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(p)}
                        disabled={actionId === p.id}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
                      >
                        {actionId === p.id ? '...' : '✓ Aprobar'}
                      </button>
                      <button
                        onClick={() => handleReject(p)}
                        disabled={actionId === p.id}
                        className="bg-red-900/50 hover:bg-red-900 border border-red-700/50 disabled:opacity-50 text-red-400 font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
                      >
                        ✕ Rechazar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
