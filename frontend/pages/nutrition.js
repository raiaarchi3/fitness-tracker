import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { getNutrientsToday, logNutrient, deleteNutrient, getUser } from '../lib/api'
import { useToast } from '../components/Toast'

/* ── Food presets ─────────────────────────────────────── */
const PRESETS = [
  { name: 'Protein Shake',        calories: 150, protein: 25, carbs: 5,  fats: 3,  fiber: 1,  cat: 'protein' },
  { name: 'Boiled Eggs ×2',       calories: 155, protein: 13, carbs: 1,  fats: 11, fiber: 0,  cat: 'protein' },
  { name: 'Chicken Breast 150g',  calories: 247, protein: 46, carbs: 0,  fats: 5,  fiber: 0,  cat: 'protein' },
  { name: 'Brown Rice 200g',      calories: 216, protein: 4,  carbs: 45, fats: 2,  fiber: 3,  cat: 'carbs'   },
  { name: 'Banana',               calories: 89,  protein: 1,  carbs: 23, fats: 0,  fiber: 3,  cat: 'carbs'   },
  { name: 'Oats 80g',             calories: 303, protein: 11, carbs: 52, fats: 6,  fiber: 8,  cat: 'carbs'   },
  { name: 'Peanut Butter 30g',    calories: 188, protein: 8,  carbs: 6,  fats: 16, fiber: 2,  cat: 'fats'    },
  { name: 'Avocado ½',            calories: 120, protein: 1,  carbs: 6,  fats: 11, fiber: 5,  cat: 'fats'    },
  { name: 'Greek Yogurt 200g',    calories: 130, protein: 17, carbs: 9,  fats: 0,  fiber: 0,  cat: 'protein' },
  { name: 'Almonds 30g',          calories: 173, protein: 6,  carbs: 6,  fats: 15, fiber: 3,  cat: 'fats'    },
  { name: 'Sweet Potato 200g',    calories: 172, protein: 4,  carbs: 40, fats: 0,  fiber: 6,  cat: 'carbs'   },
  { name: 'Cottage Cheese 150g',  calories: 163, protein: 28, carbs: 6,  fats: 2,  fiber: 0,  cat: 'protein' },
  { name: 'Milk 250ml',           calories: 122, protein: 8,  carbs: 12, fats: 5,  fiber: 0,  cat: 'mixed'   },
  { name: 'Grilled Salmon 150g',  calories: 280, protein: 39, carbs: 0,  fats: 13, fiber: 0,  cat: 'protein' },
  { name: 'White Rice 200g',      calories: 260, protein: 5,  carbs: 57, fats: 0,  fiber: 1,  cat: 'carbs'   },
]

const CAT_COLORS = { protein: '#7B6FE8', carbs: '#EF9F27', fats: '#E24B4A', mixed: '#7A7A9A' }
const CAT_ICONS  = { protein: '🥩', carbs: '🍞', fats: '🥑', mixed: '🍽️' }

function MacroBar({ label, value, goal, color }) {
  const pct = Math.min((value / Math.max(goal, 1)) * 100, 100)
  const over = value > goal
  return (
    <div className="mb-3">
      <div className="flex justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: color }} />
          <span className="text-sm font-semibold" style={{ color: '#E2E2F0' }}>{label}</span>
        </div>
        <span style={{ color: over ? '#EF9F27' : '#7A7A9A', fontSize: 12 }}>
          {Math.round(value)}g / {goal}g{over ? ' ▲' : ''}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A1A35' }}>
        <div
          className="h-2 rounded-full progress-bar"
          style={{ width: `${pct}%`, background: over ? '#EF9F27' : color }}
        />
      </div>
    </div>
  )
}

function FoodCard({ item, onDelete }) {
  const [deleting, setDeleting] = useState(false)
  const color = CAT_COLORS[item.macro_category] || '#7A7A9A'

  async function handleDelete() {
    setDeleting(true)
    await onDelete(item.id)
  }

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl mb-2 transition-all"
      style={{
        background: '#1A1A35',
        border: '1px solid #2A2A4A',
        opacity: deleting ? 0.4 : 1,
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: `${color}12` }}
      >
        {CAT_ICONS[item.macro_category] || '🍽️'}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#E2E2F0' }}>{item.food_name}</p>
        <p className="text-xs mt-0.5" style={{ color: '#7A7A9A' }}>
          {[
            item.protein > 0 && `P: ${item.protein}g`,
            item.carbs   > 0 && `C: ${item.carbs}g`,
            item.fats    > 0 && `F: ${item.fats}g`,
            item.fiber   > 0 && `Fiber: ${item.fiber}g`,
          ].filter(Boolean).join('  ·  ')}
        </p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: '#E2E2F0' }}>{item.calories}</p>
          <p style={{ color: '#4A4A6A', fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>KCAL</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
          style={{ background: 'rgba(226,75,74,0.1)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E24B4A" strokeWidth="2">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function NutritionPage() {
  const router = useRouter()
  const toast = useToast()
  const [data,     setData]     = useState(null)
  const [user,     setUser]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [search,   setSearch]   = useState('')
  const [form, setForm] = useState({
    food_name: '', calories: '', protein: '', carbs: '', fats: '', fiber: '', macro_category: 'mixed',
  })
  const formRef = useRef(null)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const [nutRes, userRes] = await Promise.allSettled([getNutrientsToday(), getUser()])
    if (nutRes.status  === 'fulfilled') setData(nutRes.value.data)
    else setData({ logs: [], totals: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 } })
    if (userRes.status === 'fulfilled') setUser(userRes.value.data)
    setLoading(false)
  }

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function applyPreset(preset) {
    setForm({
      food_name: preset.name,
      calories:  String(preset.calories),
      protein:   String(preset.protein),
      carbs:     String(preset.carbs),
      fats:      String(preset.fats),
      fiber:     String(preset.fiber),
      macro_category: preset.cat,
    })
    setShowForm(true)
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  async function handleLog() {
    if (!form.food_name.trim() || !form.calories) return
    setSaving(true)
    const payload = {
      food_name: form.food_name.trim(),
      calories:  Number(form.calories),
      protein:   Number(form.protein)  || 0,
      carbs:     Number(form.carbs)    || 0,
      fats:      Number(form.fats)     || 0,
      fiber:     Number(form.fiber)    || 0,
      macro_category: form.macro_category,
    }
    try {
      await logNutrient(payload)
    } catch {
      // optimistic add
    }
    toast(`${payload.food_name} logged!`, 'success', 2000)
    await loadAll()
    setForm({ food_name: '', calories: '', protein: '', carbs: '', fats: '', fiber: '', macro_category: 'mixed' })
    setShowForm(false)
    setSaving(false)
  }

  async function handleDelete(id) {
    try { await deleteNutrient(id); toast('Entry removed', 'info', 1500) } catch { toast('Remove failed', 'error') }
    await loadAll()
  }

  const weight       = user?.weight   || 72
  const goal         = user?.goal     || 'gain'
  const proteinGoal  = Math.round(weight * 2)
  const carbGoal     = goal === 'cut' ? 180 : 250
  const fatGoal      = Math.round(weight * 0.9)
  const calGoal      = goal === 'gain' ? 2400 : goal === 'cut' ? 1800 : 2100
  const fiberGoal    = 35
  const totals       = data?.totals || {}

  const filteredPresets = search
    ? PRESETS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : PRESETS

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
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Nutrient Log</h1>
          </div>
          <button
            onClick={() => { setShowForm(v => !v); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-80"
            style={{ background: showForm ? '#7B6FE8' : 'rgba(123,111,232,0.1)', border: '1px solid rgba(123,111,232,0.2)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={showForm ? '#fff' : '#7B6FE8'}>
              <path d={showForm ? 'M18 6L6 18M6 6l12 12' : 'M12 5v14M5 12h14'} />
            </svg>
          </button>
        </div>

        {/* Total calories card */}
        <div className="rounded-2xl p-5 mb-3 card-glow animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Daily Total</p>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 42, color: '#E2E2F0', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {(totals.calories || 0).toLocaleString()}
                <span style={{ fontSize: 16, color: '#7A7A9A', fontWeight: 400, marginLeft: 4 }}>kcal</span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <div className="h-1.5 rounded-full flex-1" style={{ background: '#1A1A35' }}>
                  <div className="h-1.5 rounded-full progress-bar"
                    style={{ width: `${Math.min((totals.calories || 0) / calGoal * 100, 100)}%`, background: '#EF9F27' }} />
                </div>
                <span style={{ color: '#7A7A9A', fontSize: 10, flexShrink: 0 }}>
                  {Math.round(Math.min((totals.calories || 0) / calGoal * 100, 100))}% of {calGoal}
                </span>
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(239,159,39,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#EF9F27">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
              </svg>
            </div>
          </div>

          <MacroBar label="Protein" value={totals.protein || 0} goal={proteinGoal} color="#7B6FE8" />
          <MacroBar label="Carbs"   value={totals.carbs   || 0} goal={carbGoal}    color="#EF9F27" />
          <MacroBar label="Fats"    value={totals.fats    || 0} goal={fatGoal}      color="#E24B4A" />
          <MacroBar label="Fiber"   value={totals.fiber   || 0} goal={fiberGoal}    color="#1D9E75" />
        </div>

        {/* Stats chips */}
        <div className="grid grid-cols-2 gap-3 mb-4 animate-stagger-3">
          <div className="rounded-xl p-3.5" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#7B6FE8"><path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z"/></svg>
              <span style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Water today</span>
            </div>
            <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 20 }}>
              2.4 <span style={{ fontSize: 12, fontWeight: 400, color: '#7A7A9A' }}>L</span>
            </p>
          </div>
          <div className="rounded-xl p-3.5 streak-glow" style={{ background: 'rgba(239,159,39,0.07)', border: '1px solid rgba(239,159,39,0.2)' }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#EF9F27"><path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z"/></svg>
              <span style={{ color: '#EF9F27', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', opacity: .8 }}>Streak</span>
            </div>
            <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#EF9F27', fontSize: 20 }}>
              {user?.streak || 0} <span style={{ fontSize: 12, fontWeight: 400 }}>days</span>
            </p>
          </div>
        </div>

        {/* Today's food log */}
        <div className="mb-4 animate-stagger-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>Today's Logs</h3>
            <span style={{ color: '#7B6FE8', fontSize: 11, fontWeight: 700 }}>
              {(data?.logs?.length || 0)} items
            </span>
          </div>
          {(data?.logs?.length || 0) === 0
            ? (
              <div className="text-center py-6 rounded-xl" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
                <p style={{ color: '#4A4A6A', fontSize: 13 }}>Nothing logged yet today</p>
                <button onClick={() => setShowForm(true)} className="mt-2 text-xs font-semibold" style={{ color: '#7B6FE8' }}>
                  + Log something
                </button>
              </div>
            )
            : (data?.logs || []).map(item => (
              <FoodCard key={item.id} item={item} onDelete={handleDelete} />
            ))
          }
        </div>

        {/* Food Presets */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>Quick Add</h3>
            <span style={{ color: '#4A4A6A', fontSize: 11 }}>tap to prefill</span>
          </div>
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4A4A6A" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search food..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
            />
          </div>
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {filteredPresets.map(p => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all hover:opacity-80"
                style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{CAT_ICONS[p.cat]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#E2E2F0' }}>{p.name}</p>
                  <p style={{ color: '#7A7A9A', fontSize: 10, marginTop: 1 }}>
                    P:{p.protein}g · C:{p.carbs}g · F:{p.fats}g
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: '#E2E2F0' }}>{p.calories}</p>
                  <p style={{ color: '#4A4A6A', fontSize: 9 }}>kcal</p>
                </div>
              </button>
            ))}
            {filteredPresets.length === 0 && (
              <p className="text-center py-3" style={{ color: '#4A4A6A', fontSize: 12 }}>No matches — log it manually below</p>
            )}
          </div>
        </div>

        {/* Manual log form */}
        <div ref={formRef}>
          {showForm && (
            <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-1" style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
              <h3 className="font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
                Log Nutrient
              </h3>

              <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Food name
              </label>
              <input
                value={form.food_name}
                onChange={e => set('food_name', e.target.value)}
                placeholder="e.g. Greek Yogurt"
                autoFocus
                className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
              />

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Calories (kcal)</label>
                  <input type="number" value={form.calories} onChange={e => set('calories', e.target.value)} placeholder="0"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
                </div>
                <div>
                  <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</label>
                  <select value={form.macro_category} onChange={e => set('macro_category', e.target.value)}
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}>
                    <option value="protein">Protein</option>
                    <option value="carbs">Carbs</option>
                    <option value="fats">Fats</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[['protein','Protein','#7B6FE8'], ['carbs','Carbs','#EF9F27'], ['fats','Fats','#E24B4A'], ['fiber','Fiber','#1D9E75']].map(([k, lbl, c]) => (
                  <div key={k}>
                    <label style={{ color: c, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{lbl} g</label>
                    <input type="number" value={form[k]} onChange={e => set(k, e.target.value)} placeholder="0"
                      className="w-full mt-1 px-2 py-2 rounded-lg outline-none text-sm text-center"
                      style={{ background: '#1A1A35', color: '#E2E2F0', border: `1px solid ${c}33` }} />
                  </div>
                ))}
              </div>

              <button
                onClick={handleLog}
                disabled={saving || !form.food_name.trim() || !form.calories}
                className="w-full py-3.5 rounded-xl font-bold text-white btn-purple disabled:opacity-40"
                style={{ fontSize: 14 }}
              >
                {saving ? 'Adding...' : 'Add to Daily Log'}
              </button>
            </div>
          )}
        </div>

        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }), 100) }}
            className="w-full py-3.5 rounded-2xl font-bold text-white btn-purple animate-stagger-5"
            style={{ fontSize: 14 }}
          >
            + Log Custom Food
          </button>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
