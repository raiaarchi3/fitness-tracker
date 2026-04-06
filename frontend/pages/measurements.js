import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { useToast } from '../components/Toast'

const STORAGE_KEY = 'ob_measurements'
const MEASURE_FIELDS = [
  { key: 'chest',    label: 'Chest',       icon: '💪', unit: 'cm' },
  { key: 'waist',    label: 'Waist',       icon: '⬤',  unit: 'cm' },
  { key: 'hips',     label: 'Hips',        icon: '⬤',  unit: 'cm' },
  { key: 'neck',     label: 'Neck',        icon: '⬤',  unit: 'cm' },
  { key: 'bicep_l',  label: 'Bicep (L)',   icon: '💪', unit: 'cm' },
  { key: 'bicep_r',  label: 'Bicep (R)',   icon: '💪', unit: 'cm' },
  { key: 'thigh_l',  label: 'Thigh (L)',   icon: '🦵', unit: 'cm' },
  { key: 'thigh_r',  label: 'Thigh (R)',   icon: '🦵', unit: 'cm' },
  { key: 'calf_l',   label: 'Calf (L)',    icon: '🦵', unit: 'cm' },
  { key: 'calf_r',   label: 'Calf (R)',    icon: '🦵', unit: 'cm' },
  { key: 'body_fat', label: 'Body fat %',  icon: '📊', unit: '%'  },
]

const EMPTY_ENTRY = Object.fromEntries(MEASURE_FIELDS.map(f => [f.key, '']))

function SparkLine({ values, color = '#7B6FE8', height = 32 }) {
  const nums = values.filter(v => v > 0)
  if (nums.length < 2) return null
  const min = Math.min(...nums), max = Math.max(...nums), range = max - min || 1
  const W = 64
  const pts = nums.map((v, i) => [
    (i / (nums.length - 1)) * W,
    height - 4 - ((v - min) / range) * (height - 8),
  ])
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  const trend = nums[nums.length - 1] - nums[0]
  return (
    <div className="flex items-center gap-2">
      <svg width={W} height={height} viewBox={`0 0 ${W} ${height}`}>
        <path d={d} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last[0]} cy={last[1]} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: 10, fontWeight: 700, color: trend > 0 ? '#E24B4A' : trend < 0 ? '#1D9E75' : '#7A7A9A' }}>
        {trend > 0 ? '+' : ''}{trend.toFixed(1)}
      </span>
    </div>
  )
}

export default function MeasurementsPage() {
  const router = useRouter()
  const toast  = useToast()
  const [history, setHistory] = useState([])
  const [form,    setForm]    = useState(EMPTY_ENTRY)
  const [adding,  setAdding]  = useState(false)
  const [activeField, setActiveField] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setHistory(parsed)
        if (parsed.length > 0) setForm({ ...EMPTY_ENTRY, ...parsed[0] })
      }
    } catch {}
  }, [])

  function save() {
    const today   = new Date().toISOString().split('T')[0]
    const entry   = { ...form, date: today }
    const filtered = history.filter(h => h.date !== today)
    const next    = [entry, ...filtered].slice(0, 52) // keep 1 year of weekly entries
    setHistory(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
    toast('Measurements saved!', 'success')
    setAdding(false)
  }

  const latest = history[0] || {}
  const prev   = history[1] || {}

  function getHistory(key) {
    return [...history].reverse().map(h => Number(h[key]) || 0)
  }

  function getDelta(key) {
    const cur = Number(latest[key])
    const old = Number(prev[key])
    if (!cur || !old) return null
    return (cur - old).toFixed(1)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 animate-stagger-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/settings')} style={{ color: '#7A7A9A' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Body</p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Measurements</h1>
            </div>
          </div>
          <button
            onClick={() => setAdding(v => !v)}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: adding ? '#7B6FE8' : 'rgba(123,111,232,0.1)', border: '1px solid rgba(123,111,232,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={adding ? '#fff' : '#7B6FE8'}>
              <path d={adding ? 'M18 6L6 18M6 6l12 12' : 'M12 5v14M5 12h14'} />
            </svg>
          </button>
        </div>

        {/* Log form */}
        {adding && (
          <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-1"
            style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
            <p className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>
              Today's measurements
            </p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {MEASURE_FIELDS.map(f => (
                <div key={f.key}>
                  <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {f.icon} {f.label}
                  </label>
                  <div className="flex items-center mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A4A' }}>
                    <input
                      type="number" step="0.1"
                      value={form[f.key]}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder="—"
                      className="flex-1 px-2 py-2 outline-none text-sm w-0 min-w-0"
                      style={{ background: '#1A1A35', color: '#E2E2F0' }}
                    />
                    <span className="px-1.5 text-xs flex-shrink-0" style={{ background: '#13132A', color: '#4A4A6A' }}>
                      {f.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={save} className="w-full py-3 rounded-xl font-bold text-white btn-purple text-sm">
              Save Measurements
            </button>
          </div>
        )}

        {/* Latest snapshot */}
        {history.length > 0 && (
          <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Latest snapshot</p>
                <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>{latest.date}</p>
              </div>
              {history.length >= 2 && (
                <span style={{ color: '#7A7A9A', fontSize: 11 }}>vs {prev.date}</span>
              )}
            </div>
            <div className="flex flex-col gap-0">
              {MEASURE_FIELDS.filter(f => latest[f.key]).map((f, i) => {
                const delta = getDelta(f.key)
                const vals  = getHistory(f.key)
                return (
                  <div key={f.key} className="flex items-center justify-between py-2.5"
                    style={{ borderBottom: i < MEASURE_FIELDS.filter(ff => latest[ff.key]).length - 1 ? '1px solid #1A1A35' : 'none' }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 14 }}>{f.icon}</span>
                      <span style={{ color: '#7A7A9A', fontSize: 12 }}>{f.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <SparkLine values={vals} />
                      {delta !== null && (
                        <span style={{
                          fontSize: 10, fontWeight: 700, minWidth: 34, textAlign: 'right',
                          color: Number(delta) > 0 ? '#E24B4A' : Number(delta) < 0 ? '#1D9E75' : '#7A7A9A',
                        }}>
                          {Number(delta) > 0 ? '+' : ''}{delta}
                        </span>
                      )}
                      <span className="font-bold" style={{ color: '#E2E2F0', fontSize: 13, minWidth: 48, textAlign: 'right' }}>
                        {latest[f.key]} {f.unit}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* History list */}
        {history.length > 1 && (
          <div className="animate-stagger-3">
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              History ({history.length} entries)
            </p>
            {history.slice(1, 6).map((entry, i) => (
              <div key={entry.date} className="rounded-xl p-3 mb-2 flex items-center justify-between"
                style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
                <span style={{ color: '#7A7A9A', fontSize: 12 }}>{entry.date}</span>
                <div className="flex gap-3">
                  {['chest', 'waist', 'body_fat'].filter(k => entry[k]).map(k => (
                    <div key={k} className="text-right">
                      <p style={{ color: '#4A4A6A', fontSize: 9 }}>{k.replace('_', ' ')}</p>
                      <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600 }}>{entry[k]}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {history.length === 0 && !adding && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">📏</div>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 12 }}>No measurements yet</p>
            <button onClick={() => setAdding(true)} className="px-6 py-3 rounded-xl font-bold text-white btn-purple text-sm">
              Log first measurement
            </button>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
