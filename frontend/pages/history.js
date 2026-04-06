import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import StreakBadge from '../components/StreakBadge'

const DAY_ABR = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

async function fetchAnalytics() {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const [weekly, calendar, sessionHistory] = await Promise.allSettled([
    fetch(`${base}/analytics/weekly`).then(r => r.json()),
    fetch(`${base}/analytics/streak-calendar`).then(r => r.json()),
    fetch(`${base}/sessions/history`).then(r => r.json()),
  ])
  return {
    weekly: weekly.status === 'fulfilled' ? weekly.value : null,
    calendar: calendar.status === 'fulfilled' ? calendar.value : [],
    sessions: sessionHistory.status === 'fulfilled' ? sessionHistory.value : [],
  }
}

function SparkLine({ values = [], color = '#7B6FE8', height = 56, gradient = true }) {
  if (values.length < 2) {
    values = [3.1, 4.2, 3.5, 5.1, 4.3, 5.6, 4.8]
  }
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 280

  const points = values.map((v, i) => [
    (i / (values.length - 1)) * W,
    height - 6 - ((v - min) / range) * (height - 14),
  ])

  const pathD = points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const areaD = `${pathD} L${W},${height} L0,${height} Z`
  const last = points[points.length - 1]

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none">
      {gradient && (
        <defs>
          <linearGradient id={`grad_${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      )}
      {gradient && <path d={areaD} fill={`url(#grad_${color.replace('#', '')})`} />}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i === points.length - 1 ? 4.5 : 2.5}
          fill={i === points.length - 1 ? color : `${color}60`} />
      ))}
    </svg>
  )
}

function ConsistencyGrid({ calendar }) {
  const today = new Date()
  const cells = []
  for (let week = 11; week >= 0; week--) {
    const row = []
    for (let d = 0; d < 7; d++) {
      const dt = new Date(today)
      dt.setDate(today.getDate() - (week * 7 + (6 - d)))
      const dateStr = dt.toISOString().split('T')[0]
      const entry = calendar.find(c => c.date === dateStr)
      const isFuture = dt > today
      row.push({ dateStr, active: entry?.completed || false, isFuture })
    }
    cells.push(row)
  }

  return (
    <div>
      <div className="flex gap-0.5 mb-1">
        {DAY_ABR.map((d, i) => (
          <span key={i} className="flex-1 text-center" style={{ color: '#4A4A6A', fontSize: 8 }}>{d[0]}</span>
        ))}
      </div>
      {cells.map((row, ri) => (
        <div key={ri} className="flex gap-0.5 mb-0.5">
          {row.map((cell, ci) => (
            <div
              key={ci}
              className="flex-1 rounded-sm"
              style={{
                height: 14,
                background: cell.isFuture
                  ? 'transparent'
                  : cell.active
                  ? '#7B6FE8'
                  : 'rgba(123,111,232,0.08)',
                border: cell.isFuture ? '1px solid #1A1A35' : 'none',
              }}
              title={cell.dateStr}
            />
          ))}
        </div>
      ))}
      <div className="flex items-center justify-between mt-2">
        <span style={{ color: '#4A4A6A', fontSize: 9 }}>Less active</span>
        <div className="flex gap-1">
          {[0.08, 0.3, 0.6, 1].map((o, i) => (
            <div key={i} className="w-2.5 h-2.5 rounded-sm" style={{ background: `rgba(123,111,232,${o})` }} />
          ))}
        </div>
        <span style={{ color: '#4A4A6A', fontSize: 9 }}>More active</span>
      </div>
    </div>
  )
}

function MacroDonut({ protein = 140, carbs = 210, fats = 38 }) {
  const slices = [
    { label: 'PROTEIN', val: `${Math.round(protein)} / 180`, color: '#7B6FE8', kcal: protein * 4 },
    { label: 'CARBS', val: `${Math.round(carbs)} / 250`, color: '#EF9F27', kcal: carbs * 4 },
    { label: 'FATS', val: `${Math.round(fats)} / 80`, color: '#E24B4A', kcal: fats * 9 },
  ]
  const total = slices.reduce((a, s) => a + s.kcal, 0) || 1
  const r = 30, circ = 2 * Math.PI * r
  let cumulative = 0

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-shrink-0" style={{ width: 80, height: 80 }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#1A1A35" strokeWidth="10" />
          {slices.map((s, i) => {
            const pct = s.kcal / total
            const dash = pct * circ
            const dashoffset = -(cumulative * circ) - (circ * 0.25)
            cumulative += pct
            return (
              <circle key={i} cx="40" cy="40" r={r}
                fill="none" stroke={s.color} strokeWidth="10"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={dashoffset}
                strokeLinecap="butt"
              />
            )
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span style={{ color: '#E2E2F0', fontSize: 9, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>
            Bal.
          </span>
        </div>
      </div>
      <div className="flex-1">
        {slices.map(s => (
          <div key={s.label} className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
              <span style={{ color: '#7A7A9A', fontSize: 10, fontWeight: 600 }}>{s.label}</span>
            </div>
            <span style={{ color: '#E2E2F0', fontSize: 11, fontWeight: 700 }}>{s.val}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HistoryPage() {
  const router = useRouter()
  const [data, setData] = useState(null)
  const [activeTab, setActiveTab] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const weekly = data?.weekly
  const calendar = data?.calendar || []
  const sessions = data?.sessions || []

  // Build 7-day series from weekly data
  const today = new Date()
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const waterSeries = last7.map(day => {
    const entry = weekly?.water?.find(w => w.date === day)
    return entry ? entry.amount_ml / 1000 : 0
  })

  const focusSeries = [4.5, 5.2, 3.8, 6.1, 4.9, 5.8, 4.7]
  const completedThisWeek = weekly?.sessions?.filter(s => s.completed).length || 0
  const avgWater = waterSeries.filter(v => v > 0).length
    ? (waterSeries.reduce((a, v) => a + v, 0) / waterSeries.filter(v => v > 0).length).toFixed(1)
    : '2.4'

  const lastNutrient = weekly?.nutrients?.[weekly.nutrients.length - 1] || {}

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 animate-stagger-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} style={{ color: '#7A7A9A' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Performance Vault
              </p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                Vault Overview
              </h1>
            </div>
          </div>
          <StreakBadge streak={weekly?.streak || 0} />
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 p-1 rounded-xl mb-5 animate-stagger-2"
          style={{ background: '#13132A', border: '1px solid #2A2A4A' }}
        >
          {['weekly', 'monthly'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize"
              style={{ background: activeTab === t ? '#7B6FE8' : 'transparent', color: activeTab === t ? '#fff' : '#7A7A9A' }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4 animate-stagger-2">
          {[
            { label: 'Workouts', val: completedThisWeek, sub: 'this week' },
            { label: 'Avg water', val: avgWater + 'L', sub: 'daily avg' },
            { label: 'Streak', val: (weekly?.streak || 0) + ' days', sub: 'current' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p className="font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>{s.val}</p>
              <p style={{ color: '#7A7A9A', fontSize: 9, marginTop: 1 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Focus performance */}
        <div className="rounded-2xl p-4 mb-3 card-glow animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 14, fontFamily: 'Syne, sans-serif' }}>Focus performance</p>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>
                DAILY WEEK ANALYSIS
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 24, lineHeight: 1 }}>
                34.2<span style={{ fontSize: 13, color: '#7A7A9A', fontWeight: 400 }}>h</span>
              </p>
              <p style={{ color: '#4A4A6A', fontSize: 9, marginTop: 2 }}>AVG / WEEK</p>
            </div>
          </div>
          <SparkLine values={focusSeries} color="#7B6FE8" height={60} />
          <div className="flex justify-between mt-1.5">
            {DAY_ABR.map(d => <span key={d} style={{ color: '#4A4A6A', fontSize: 8 }}>{d}</span>)}
          </div>
          <button
            onClick={() => router.push('/study')}
            className="mt-3 text-xs font-semibold transition-all hover:opacity-70"
            style={{ color: '#7B6FE8' }}
          >
            Open study tracker →
          </button>
        </div>

        {/* Hydration */}
        <div className="rounded-2xl p-4 mb-3 card-glow animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 14, fontFamily: 'Syne, sans-serif' }}>Hydration</p>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>WATER INTAKE</p>
            </div>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#7B6FE8">
              <path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z" />
            </svg>
          </div>
          <p className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 30, lineHeight: 1 }}>
            {avgWater} <span style={{ fontSize: 14, color: '#7A7A9A', fontWeight: 400 }}>L / day avg</span>
          </p>
          <SparkLine values={waterSeries.map(v => v || 0.1)} color="#378ADD" height={44} gradient={false} />
          <div className="flex justify-between mt-1">
            {DAY_ABR.map(d => <span key={d} style={{ color: '#4A4A6A', fontSize: 8 }}>{d}</span>)}
          </div>
        </div>

        {/* Consistency */}
        <div className="rounded-2xl p-4 mb-3 card-glow animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 14, fontFamily: 'Syne, sans-serif' }}>Consistency</p>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>12-WEEK WORKOUT FREQUENCY</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => router.push('/stats')} className="text-xs font-semibold" style={{ color: '#EF9F27' }}>🏅 Lifetime</button>
              <button onClick={() => router.push('/workout/history')} className="text-xs font-semibold transition-all hover:opacity-70" style={{ color: '#7B6FE8' }}>All sessions →</button>
            </div>
          </div>
          <ConsistencyGrid calendar={calendar} />
        </div>

        {/* Nutrient Tracking */}
        <div className="rounded-2xl p-4 mb-3 card-glow animate-stagger-5" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 14, fontFamily: 'Syne, sans-serif' }}>Nutrient Tracking</p>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>MACRO BREAKDOWN</p>
            </div>
            <button
              onClick={() => router.push('/nutrition')}
              className="text-xs font-semibold transition-all hover:opacity-70"
              style={{ color: '#7B6FE8' }}
            >
              ADJUST DATA
            </button>
          </div>
          <MacroDonut
            protein={lastNutrient.pr || 142}
            carbs={lastNutrient.cb || 210}
            fats={38}
          />
          <div className="flex justify-between mt-4 pt-3" style={{ borderTop: '1px solid #1A1A35' }}>
            {[
              { label: 'PAST WEEK', val: lastNutrient.date ? new Date(lastNutrient.date + 'T00:00').toLocaleDateString('en', { weekday: 'short' }) : 'Wed' },
              { label: 'OPTIMAL', val: 'Optimal' },
              { label: 'NUT. SCORE', val: '88/100' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p style={{ color: '#4A4A6A', fontSize: 9, fontWeight: 600 }}>{item.label}</p>
                <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 700, marginTop: 3 }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Vault security */}
        <div
          className="rounded-2xl p-4 animate-stagger-6 flex items-center justify-between"
          style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.25)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(123,111,232,0.1)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7B6FE8" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <div>
              <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 500 }}>Vault Security Active</p>
              <p style={{ color: '#4A4A6A', fontSize: 10, marginTop: 1 }}>LAST SYNCED: JUST NOW</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/nutrition')}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold hover:opacity-80 transition-all"
            style={{ background: 'rgba(123,111,232,0.1)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.25)' }}
          >
            Sync Entry
          </button>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
