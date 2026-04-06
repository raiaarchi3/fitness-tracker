import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../../components/BottomNav'
import { useToast } from '../../components/Toast'

const STORAGE_KEY = 'ob_exercise_pbs'

const DEFAULT_PBs = {
  'Bench Press':        { lbs: 185, date: '2026-03-28', reps: 8,  history: [{date:'2026-03-01',lbs:135,reps:10},{date:'2026-03-14',lbs:155,reps:8},{date:'2026-03-28',lbs:185,reps:8}] },
  'Deadlift':           { lbs: 225, date: '2026-03-25', reps: 5,  history: [{date:'2026-03-05',lbs:185,reps:5},{date:'2026-03-20',lbs:205,reps:5},{date:'2026-03-25',lbs:225,reps:5}] },
  'Back Squat':         { lbs: 185, date: '2026-03-30', reps: 8,  history: [{date:'2026-03-10',lbs:135,reps:8},{date:'2026-03-24',lbs:165,reps:8},{date:'2026-03-30',lbs:185,reps:8}] },
  'Overhead Press':     { lbs: 95,  date: '2026-03-27', reps: 8,  history: [{date:'2026-03-07',lbs:65,reps:8},{date:'2026-03-21',lbs:80,reps:8},{date:'2026-03-27',lbs:95,reps:8}] },
  'Barbell Curl':       { lbs: 65,  date: '2026-03-29', reps: 12, history: [{date:'2026-03-08',lbs:45,reps:12},{date:'2026-03-22',lbs:55,reps:12},{date:'2026-03-29',lbs:65,reps:12}] },
  'Lat Pulldown':       { lbs: 120, date: '2026-03-26', reps: 12, history: [{date:'2026-03-06',lbs:90,reps:12},{date:'2026-03-19',lbs:105,reps:12},{date:'2026-03-26',lbs:120,reps:12}] },
}

function MiniSparkLine({ history, color = '#7B6FE8' }) {
  if (!history || history.length < 2) return null
  const vals = history.map(h => h.lbs)
  const min  = Math.min(...vals)
  const max  = Math.max(...vals)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = vals.map((v, i) => [
    (i / (vals.length - 1)) * W,
    H - ((v - min) / range) * (H - 6) - 3,
  ])
  const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last[0]} cy={last[1]} r="3" fill={color} />
    </svg>
  )
}

export default function ExerciseProgressPage() {
  const router = useRouter()
  const toast  = useToast()
  const [pbs,     setPbs]     = useState(DEFAULT_PBs)
  const [filter,  setFilter]  = useState('all')
  const [adding,  setAdding]  = useState(false)
  const [newForm, setNewForm] = useState({ name: '', lbs: '', reps: '' })
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setPbs(p => ({ ...DEFAULT_PBs, ...JSON.parse(saved) }))
    } catch {}
  }, [])

  function savePbs(next) {
    setPbs(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  function logNewPB() {
    if (!newForm.name.trim() || !newForm.lbs) return
    const today = new Date().toISOString().split('T')[0]
    const existing = pbs[newForm.name] || { lbs: 0, date: today, reps: 0, history: [] }
    const entry = { date: today, lbs: Number(newForm.lbs), reps: Number(newForm.reps) || 1 }
    const isNew = Number(newForm.lbs) > (existing.lbs || 0)
    const next = {
      ...pbs,
      [newForm.name]: {
        lbs:     isNew ? Number(newForm.lbs) : existing.lbs,
        date:    isNew ? today : existing.date,
        reps:    Number(newForm.reps) || existing.reps,
        history: [...(existing.history || []), entry],
      }
    }
    savePbs(next)
    setNewForm({ name: '', lbs: '', reps: '' })
    setAdding(false)
    toast(isNew ? `🏆 New PB: ${newForm.name}!` : `${newForm.name} logged`, 'success')
  }

  const exercises = Object.entries(pbs)
  const MUSCLE_MAP = {
    'Bench Press': 'Chest',    'Incline DB Fly': 'Chest',
    'Deadlift': 'Back',        'Lat Pulldown': 'Back',       'Bent-Over Row': 'Back',
    'Back Squat': 'Legs',      'Leg Press': 'Legs',           'Romanian Deadlift': 'Legs',
    'Overhead Press': 'Shoulder', 'Lateral Raises': 'Shoulder',
    'Barbell Curl': 'Arms',    'Tricep Pushdown': 'Arms',
  }
  const GROUPS = ['all', 'Chest', 'Back', 'Legs', 'Shoulder', 'Arms']
  const filtered = filter === 'all'
    ? exercises
    : exercises.filter(([name]) => MUSCLE_MAP[name] === filter)

  const totalPBs = exercises.length
  const latestPB = exercises.sort((a, b) => (b[1].date || '').localeCompare(a[1].date || ''))[0]

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center justify-between mb-5 animate-stagger-1">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} style={{ color: '#7A7A9A' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
            </button>
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Tracking</p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Exercise Progress</h1>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4 animate-stagger-2">
          {[
            { label: 'Exercises', val: totalPBs, sub: 'tracked' },
            { label: 'Latest PB', val: latestPB?.[0]?.split(' ')[0] || '—', sub: latestPB?.[1]?.date || '—' },
            { label: 'Top lift', val: `${Math.max(...exercises.map(([,v]) => v.lbs || 0))} lbs`, sub: 'personal best' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p className="font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15, lineHeight: 1.2 }}>{s.val}</p>
              <p style={{ color: '#7A7A9A', fontSize: 9, marginTop: 2 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Log new lift */}
        {adding && (
          <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-1"
            style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
            <p className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>
              Log a lift
            </p>
            <div className="mb-3">
              <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Exercise name</label>
              <input
                value={newForm.name}
                onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Bench Press"
                list="exercise-list"
                autoFocus
                className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
              />
              <datalist id="exercise-list">
                {Object.keys(pbs).map(n => <option key={n} value={n} />)}
              </datalist>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weight (lbs)</label>
                <input type="number" value={newForm.lbs}
                  onChange={e => setNewForm(p => ({ ...p, lbs: e.target.value }))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
              </div>
              <div>
                <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reps</label>
                <input type="number" value={newForm.reps}
                  onChange={e => setNewForm(p => ({ ...p, reps: e.target.value }))}
                  placeholder="0"
                  className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
              </div>
            </div>
            <button
              onClick={logNewPB}
              disabled={!newForm.name.trim() || !newForm.lbs}
              className="w-full py-3 rounded-xl font-bold text-white btn-purple disabled:opacity-40 text-sm"
            >
              Log Lift
            </button>
          </div>
        )}

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 animate-stagger-3" style={{ scrollbarWidth: 'none' }}>
          {GROUPS.map(g => (
            <button
              key={g}
              onClick={() => setFilter(g)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === g ? '#7B6FE8' : '#13132A',
                color:      filter === g ? '#fff' : '#7A7A9A',
                border:     `1px solid ${filter === g ? 'transparent' : '#2A2A4A'}`,
                textTransform: 'capitalize',
              }}
            >
              {g === 'all' ? 'All' : g}
            </button>
          ))}
        </div>

        {/* Exercise cards */}
        {filtered.map(([name, data]) => {
          const delta = data.history?.length >= 2
            ? data.lbs - data.history[0].lbs
            : 0
          const isSelected = selected === name
          return (
            <div
              key={name}
              className="rounded-2xl mb-3 overflow-hidden transition-all"
              style={{ background: '#13132A', border: `1px solid ${isSelected ? '#7B6FE8' : '#2A2A4A'}` }}
            >
              <button
                onClick={() => setSelected(isSelected ? null : name)}
                className="w-full flex items-center gap-3 p-4 text-left"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                    {name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span style={{ color: '#7A7A9A', fontSize: 11 }}>PB: {data.lbs} lbs × {data.reps} reps</span>
                    {delta > 0 && (
                      <span className="px-1.5 py-0.5 rounded" style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontSize: 9, fontWeight: 700 }}>
                        +{delta} lbs
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <MiniSparkLine history={data.history} />
                  <span style={{ color: '#4A4A6A', fontSize: 9 }}>{data.date}</span>
                </div>
              </button>

              {isSelected && data.history?.length > 0 && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid #1A1A35' }}>
                  <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 12, marginBottom: 8 }}>
                    Progression
                  </p>
                  {[...data.history].reverse().slice(0, 6).map((h, i) => (
                    <div key={i} className="flex justify-between items-center py-2"
                      style={{ borderBottom: i < Math.min(data.history.length, 6) - 1 ? '1px solid #1A1A35' : 'none' }}>
                      <span style={{ color: '#7A7A9A', fontSize: 12 }}>{h.date}</span>
                      <div className="flex items-center gap-3">
                        <span style={{ color: '#4A4A6A', fontSize: 12 }}>{h.reps} reps</span>
                        <span style={{ color: h.lbs === data.lbs ? '#7B6FE8' : '#E2E2F0', fontSize: 13, fontWeight: 700 }}>
                          {h.lbs} lbs
                          {h.lbs === data.lbs && <span style={{ color: '#EF9F27', marginLeft: 4 }}>🏆</span>}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

      </div>
      <BottomNav />
    </div>
  )
}
