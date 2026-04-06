import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import StreakBadge from '../components/StreakBadge'
import { getUser, updateUser, logWeight, getWeightHistory } from '../lib/api'
import { useToast } from '../components/Toast'
import WeightTrendPredictor from '../components/WeightTrendPredictor'

const GOALS = [
  { value: 'gain', label: 'Muscle Gain', icon: '💪', desc: '+300 kcal surplus' },
  { value: 'cut', label: 'Fat Loss', icon: '🔥', desc: '−400 kcal deficit' },
  { value: 'maintain', label: 'Maintain', icon: '⚖️', desc: 'Maintenance calories' },
]

const ACTIVITIES = [
  { value: '1.2', label: 'Sedentary', desc: 'Little or no exercise' },
  { value: '1.375', label: 'Light', desc: '1–2 days/week' },
  { value: '1.55', label: 'Moderate', desc: '3–5 days/week' },
  { value: '1.725', label: 'Very Active', desc: '6–7 days/week' },
]

function calcTargets(weight, height, age, activityMult, goal) {
  const w = weight || 72
  const h = height || 175
  const a = age || 24
  const mult = Number(activityMult) || 1.55
  const bmi = (w / ((h / 100) ** 2)).toFixed(1)
  const bmiLabel = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese'
  const bmr = 88.36 + 13.4 * w + 4.8 * h - 5.7 * a
  const tdee = Math.round(bmr * mult)
  const cal = goal === 'gain' ? tdee + 300 : goal === 'cut' ? tdee - 400 : tdee
  const protein = Math.round(w * 2)
  const fats = Math.round(w * 0.9)
  const carbs = Math.round((cal - protein * 4 - fats * 9) / 4)
  const water = (w * 0.035 + 0.5).toFixed(1)
  const idealMin = Math.round(18.5 * ((h / 100) ** 2))
  const idealMax = Math.round(24.9 * ((h / 100) ** 2))
  return { bmi, bmiLabel, cal, protein, carbs, fats, water, idealMin, idealMax, tdee }
}

export default function SettingsPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: 'Aarchi', weight: 72, height: 175, age: 24, goal: 'gain', activity: '1.55' })
  const [newWeight, setNewWeight] = useState('')
  const [weightHistory, setWeightHistory] = useState([])
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [weightLogged, setWeightLogged] = useState(false)
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    getUser().then(r => {
      const u = r.data
      setForm(prev => ({
        ...prev,
        name: u.name || 'Aarchi',
        weight: u.weight || 72,
        height: u.height || 175,
        age: u.age || 24,
        goal: u.goal || 'gain',
      }))
      setStreak(u.streak || 0)
    }).catch(() => {})
    getWeightHistory().then(r => setWeightHistory(r.data)).catch(() => {})
  }, [])

  function set(key, val) {
    setForm(prev => ({ ...prev, [key]: val }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await updateUser({ name: form.name, weight: Number(form.weight), height: Number(form.height), age: Number(form.age), goal: form.goal })
      setSaved(true)
      toast('Profile saved!', 'success')
      setTimeout(() => setSaved(false), 2500)
    } catch {}
    setSaving(false)
  }

  async function handleLogWeight() {
    if (!newWeight) return
    try {
      await logWeight(Number(newWeight))
      setForm(prev => ({ ...prev, weight: Number(newWeight) }))
      setWeightHistory(prev => [{ date: new Date().toISOString().split('T')[0], weight: Number(newWeight) }, ...prev.slice(0, 13)])
      setNewWeight('')
      toast(`Weight ${newWeight}kg logged!`, 'success', 2000)
      setWeightLogged(true)
      setTimeout(() => setWeightLogged(false), 2000)
    } catch {
      setForm(prev => ({ ...prev, weight: Number(newWeight) }))
      setNewWeight('')
      toast(`Weight ${newWeight}kg saved locally`, 'info', 2000)
      setWeightLogged(true)
      setTimeout(() => setWeightLogged(false), 2000)
    }
  }

  const targets = calcTargets(form.weight, form.height, form.age, form.activity, form.goal)

  const targetRows = [
    { label: 'BMI', val: `${targets.bmi} — ${targets.bmiLabel}` },
    { label: 'Daily calories', val: `${targets.cal} kcal` },
    { label: 'Protein target', val: `${targets.protein} g / day` },
    { label: 'Carbs target', val: `${targets.carbs} g / day` },
    { label: 'Fats target', val: `${targets.fats} g / day` },
    { label: 'Daily water', val: `${targets.water} L / day` },
    { label: 'Healthy weight range', val: `${targets.idealMin}–${targets.idealMax} kg` },
    { label: 'Base metabolic rate', val: `${Math.round(targets.tdee)} kcal` },
  ]

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
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Settings</h1>
          </div>
          <StreakBadge streak={streak} />
        </div>

        {/* Profile card */}
        <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>Profile</h3>

          <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</label>
          <input
            value={form.name}
            onChange={e => set('name', e.target.value)}
            className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
          />

          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { key: 'age', label: 'Age', unit: 'yrs' },
              { key: 'height', label: 'Height', unit: 'cm' },
              { key: 'weight', label: 'Weight', unit: 'kg' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</label>
                <div className="flex items-center mt-1 rounded-xl overflow-hidden" style={{ border: '1px solid #2A2A4A' }}>
                  <input
                    type="number"
                    value={form[f.key]}
                    onChange={e => set(f.key, e.target.value)}
                    step={f.key === 'weight' ? '0.1' : '1'}
                    className="flex-1 px-2 py-2 outline-none text-sm w-0 min-w-0"
                    style={{ background: '#1A1A35', color: '#E2E2F0' }}
                  />
                  <span className="px-1.5 text-xs flex-shrink-0" style={{ background: '#13132A', color: '#4A4A6A' }}>{f.unit}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Goal selector */}
          <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Goal
          </label>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {GOALS.map(g => (
              <button
                key={g.value}
                onClick={() => set('goal', g.value)}
                className="py-3 rounded-xl flex flex-col items-center gap-1.5 transition-all hover:opacity-80"
                style={{
                  background: form.goal === g.value ? 'rgba(123,111,232,0.15)' : '#1A1A35',
                  border: `1px solid ${form.goal === g.value ? '#7B6FE8' : '#2A2A4A'}`,
                }}
              >
                <span style={{ fontSize: 20 }}>{g.icon}</span>
                <span style={{ color: form.goal === g.value ? '#9B8FF8' : '#7A7A9A', fontSize: 10, fontWeight: 600 }}>{g.label}</span>
                <span style={{ color: '#4A4A6A', fontSize: 9 }}>{g.desc}</span>
              </button>
            ))}
          </div>

          {/* Activity level */}
          <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>
            Activity Level
          </label>
          <div className="flex gap-1.5 flex-wrap mb-4">
            {ACTIVITIES.map(a => (
              <button
                key={a.value}
                onClick={() => set('activity', a.value)}
                className="px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: form.activity === a.value ? 'rgba(123,111,232,0.15)' : '#1A1A35',
                  color: form.activity === a.value ? '#9B8FF8' : '#7A7A9A',
                  border: `1px solid ${form.activity === a.value ? '#7B6FE8' : '#2A2A4A'}`,
                }}
              >
                {a.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3.5 rounded-xl font-bold text-white btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ fontSize: 14 }}
          >
            {saving ? (
              <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
            ) : saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Saved!
              </>
            ) : 'Save Changes'}
          </button>
        </div>

        {/* Log Today's Weight */}
        <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <h3 className="font-bold mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
            Log Today's Weight
          </h3>
          <p style={{ color: '#7A7A9A', fontSize: 12, marginBottom: 12 }}>
            Current: {form.weight} kg
            {weightHistory.length >= 2 && (
              <span style={{ color: Number(weightHistory[0]?.weight) > Number(weightHistory[1]?.weight) ? '#E24B4A' : '#1D9E75', marginLeft: 8 }}>
                {Number(weightHistory[0]?.weight) > Number(weightHistory[1]?.weight) ? '▲' : '▼'}
                {Math.abs(Number(weightHistory[0]?.weight) - Number(weightHistory[1]?.weight)).toFixed(1)} kg
              </span>
            )}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              value={newWeight}
              onChange={e => setNewWeight(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogWeight()}
              placeholder={`${form.weight} kg`}
              step="0.1"
              className="flex-1 px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
            />
            <button
              onClick={handleLogWeight}
              disabled={!newWeight}
              className="px-5 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40"
              style={{
                background: weightLogged ? '#1D9E75' : '#7B6FE8',
                color: '#fff',
              }}
            >
              {weightLogged ? '✓' : 'Log'}
            </button>
          </div>

          {/* Mini weight history */}
          {weightHistory.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Recent</p>
              {weightHistory.slice(0, 5).map((w, i) => (
                <div key={i} className="flex justify-between py-1.5" style={{ borderBottom: i < 4 ? '1px solid rgba(42,42,74,0.4)' : 'none' }}>
                  <span style={{ color: '#7A7A9A', fontSize: 12 }}>{w.date}</span>
                  <span style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600 }}>{w.weight} kg</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Calculated Targets */}
        <div className="rounded-2xl p-4 card-glow animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <h3 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
            Your Targets
          </h3>
          <p style={{ color: '#4A4A6A', fontSize: 11, marginBottom: 12 }}>Auto-calculated from your profile — updates live as you edit above.</p>
          {targetRows.map((row, i) => (
            <div
              key={row.label}
              className="flex justify-between items-center py-2.5"
              style={{ borderBottom: i < targetRows.length - 1 ? '1px solid #1A1A35' : 'none' }}
            >
              <span style={{ color: '#7A7A9A', fontSize: 13 }}>{row.label}</span>
              <span style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 600 }}>{row.val}</span>
            </div>
          ))}
        </div>

        {/* Weight trend predictor */}
        {weightHistory.length >= 2 && (
          <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
            <h3 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
              Weight trend
            </h3>
            <WeightTrendPredictor
              history={weightHistory}
              goalWeight={targets.idealMin + (targets.idealMax - targets.idealMin) / 2}
              currentGoal={form.goal}
            />
          </div>
        )}

        {/* Quick links */}
        <div className="rounded-2xl overflow-hidden mt-4 animate-stagger-4" style={{ border: '1px solid #2A2A4A' }}>
          {[
            { icon: '🔔', label: 'Notifications', sub: 'Water, gym & meal reminders', href: '/notifications' },
            { icon: '🏋️', label: 'Workout history',  sub: 'All past sessions',         href: '/workout/history'  },
            { icon: '🗓️', label: 'Workout split',   sub: 'Customise your weekly split',  href: '/workout/split'    },
            { icon: '🏆', label: 'Exercise PBs',    sub: 'Track personal bests',          href: '/workout/progress' },
            { icon: '📏', label: 'Body measurements', sub: 'Measurements & body stats',  href: '/measurements'     },
            { icon: '📊', label: 'Performance vault', sub: 'Charts and analytics',  href: '/history' },
            { icon: '🏅', label: 'Lifetime stats',    sub: 'All-time records & achievements', href: '/stats' },
            { icon: '🚀', label: 'Redo onboarding', sub: 'Reset your setup',    href: '/onboarding' },
            { icon: '📤', label: 'Export data',    sub: 'Download as JSON or CSV',  href: '/export'      },
          ].map((item, i, arr) => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all hover:opacity-80"
              style={{
                background: '#13132A',
                borderBottom: i < arr.length - 1 ? '1px solid #1A1A35' : 'none',
              }}
            >
              <span style={{ fontSize: 18, width: 28, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <div className="flex-1">
                <p style={{ color: '#E2E2F0', fontSize: 14, fontWeight: 500 }}>{item.label}</p>
                <p style={{ color: '#4A4A6A', fontSize: 11, marginTop: 1 }}>{item.sub}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4A6A" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        {/* Version info */}
        <p className="text-center mt-5 mb-2" style={{ color: '#2A2A4A', fontSize: 11 }}>
          Obsidian Lens v1.0.0 · Built with Next.js + FastAPI
        </p>

      </div>
      <BottomNav />
    </div>
  )
}
