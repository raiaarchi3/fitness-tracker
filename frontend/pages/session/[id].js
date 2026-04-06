import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/router'
import StreakBadge from '../../components/StreakBadge'
import { useToast } from '../../components/Toast'
import { getSession, startSession, addExercise, updateExercise, completeSession, getToday } from '../../lib/api'

const SPLIT_KEY = 'ob_split'
const DEFAULT_SPLIT = {
  Monday:'Chest', Tuesday:'Back', Wednesday:'Shoulder',
  Thursday:'Arms', Friday:'Legs', Saturday:'Core', Sunday:'Rest',
}

function getSavedSplit() {
  try {
    const s = localStorage.getItem(SPLIT_KEY)
    return s ? JSON.parse(s) : DEFAULT_SPLIT
  } catch { return DEFAULT_SPLIT }
}

/* ─── Rest Timer overlay ─────────────────────────────── */
function RestTimer({ seconds, onDone, onSkip }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const t = setInterval(() => {
      setLeft(s => { if (s <= 1) { clearInterval(t); onDone(); return 0 } return s - 1 })
    }, 1000)
    return () => clearInterval(t)
  }, [])
  const pct = 1 - left / seconds
  const r = 44, circ = 2 * Math.PI * r
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(13,13,26,0.92)', backdropFilter: 'blur(8px)' }}>
      <div className="text-center">
        <p style={{ color: '#7A7A9A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Rest timer
        </p>
        <div className="relative inline-flex items-center justify-center" style={{ width: 120, height: 120 }}>
          <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="6" stroke="rgba(123,111,232,0.1)" />
            <circle cx="60" cy="60" r={r} fill="none" strokeWidth="6" stroke="#7B6FE8"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)}
              strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
          </svg>
          <span className="absolute font-bold" style={{ fontFamily: 'Syne, sans-serif', fontSize: 32, color: '#E2E2F0' }}>
            {left}
          </span>
        </div>
        <p style={{ color: '#7A7A9A', fontSize: 13, margin: '12px 0 20px' }}>seconds remaining</p>
        <button onClick={onSkip}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm"
          style={{ background: 'rgba(123,111,232,0.12)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.25)' }}>
          Skip rest
        </button>
      </div>
    </div>
  )
}

/* ─── Set Row ────────────────────────────────────────── */
function SetRow({ s, idx, done, onUpdate, onDelete, onToggle }) {
  return (
    <div className="grid gap-2 items-center py-2"
      style={{ gridTemplateColumns: '28px 1fr 1fr 28px 32px', borderBottom: '1px solid rgba(42,42,74,0.4)' }}>
      <span className="text-center text-sm font-bold rounded-md py-0.5"
        style={{ color: done ? '#fff' : '#7A7A9A', background: done ? '#7B6FE8' : 'transparent' }}>
        {s.set}
      </span>
      <input type="number" value={s.lbs}
        onChange={e => onUpdate(idx, 'lbs', Number(e.target.value))}
        className="rounded-lg text-center text-sm font-semibold py-1.5 outline-none w-full"
        style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
      <input type="number" value={s.reps}
        onChange={e => onUpdate(idx, 'reps', Number(e.target.value))}
        className="rounded-lg text-center text-sm font-semibold py-1.5 outline-none w-full"
        style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
      <button onClick={() => onToggle(idx)}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90 flex-shrink-0"
        style={{ background: done ? '#7B6FE8' : 'rgba(123,111,232,0.08)', border: `1px solid ${done ? '#7B6FE8' : 'rgba(123,111,232,0.2)'}` }}>
        {done && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>}
      </button>
      <button onClick={() => onDelete(idx)}
        className="w-7 h-7 rounded-md flex items-center justify-center transition-all active:scale-90"
        style={{ background: 'rgba(226,75,74,0.08)', color: '#E24B4A', fontSize: 12 }}>✕</button>
    </div>
  )
}

/* ─── Exercise Card ──────────────────────────────────── */
function ExerciseCard({ ex, onUpdateSet, onAddSet, onDeleteSet, onToggleSet, onToggleDone, onDelete, onStartRest }) {
  const [open, setOpen] = useState(true)
  const doneCount = ex.sets_data.filter(s => s._done).length

  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: '#13132A', border: `1px solid ${ex.completed ? 'rgba(123,111,232,0.4)' : '#2A2A4A'}`, transition: 'border-color 0.3s' }}>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>{ex.name}</h3>
            {ex.completed && (
              <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: '#7B6FE8' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
              </div>
            )}
          </div>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 1 }}>
            {ex.category}
          </p>
        </div>
        <div className="flex items-center gap-1 ml-2 flex-shrink-0">
          {doneCount > 0 && (
            <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75', fontWeight: 600 }}>
              {doneCount}/{ex.sets_data.length}
            </span>
          )}
          <button onClick={() => setOpen(v => !v)}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1A1A35' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7A7A9A" strokeWidth="2">
              {open ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
            </svg>
          </button>
          <button onClick={() => onDelete(ex.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: '#1A1A35' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4A4A6A" strokeWidth="2">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Sets */}
      {open && (
        <div className="px-4 pb-3">
          <div className="grid gap-2 mb-1" style={{ gridTemplateColumns: '28px 1fr 1fr 28px 32px' }}>
            {['SET','LBS','REPS','✓',''].map((h, i) => (
              <span key={i} className="text-center" style={{ color: '#4A4A6A', fontSize: 9, fontWeight: 600, letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>
          {ex.sets_data.map((s, i) => (
            <SetRow key={i} s={s} idx={i} done={!!s._done}
              onUpdate={(idx, f, v) => onUpdateSet(ex.id, idx, f, v)}
              onDelete={idx => onDeleteSet(ex.id, idx)}
              onToggle={idx => onToggleSet(ex.id, idx)} />
          ))}
          <div className="flex gap-2 mt-3">
            <button onClick={() => onAddSet(ex.id)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(123,111,232,0.07)', color: '#7B6FE8', border: '1px solid rgba(123,111,232,0.18)' }}>
              + ADD SET
            </button>
            <button onClick={() => onStartRest(60)}
              className="px-3 py-2 rounded-xl text-xs font-semibold"
              style={{ background: 'rgba(239,159,39,0.08)', color: '#EF9F27', border: '1px solid rgba(239,159,39,0.2)' }}>
              ⏱ Rest
            </button>
            <button onClick={() => onToggleDone(ex.id)}
              className="px-4 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: ex.completed ? '#7B6FE8' : 'transparent',
                color: ex.completed ? '#fff' : '#7A7A9A',
                border: `1px solid ${ex.completed ? '#7B6FE8' : '#2A2A4A'}`,
              }}>
              {ex.completed ? '✓ Done' : 'Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Add Exercise Modal ─────────────────────────────── */
const SUGGESTIONS = {
  Chest:    ['Cable Crossover','Chest Dips','Pec Deck','Push-Ups','Landmine Press','Decline Press'],
  Back:     ['T-Bar Row','Single-Arm Row','Hyperextension','Good Morning','Meadows Row','Cable Row'],
  Shoulder: ['Upright Row','Cable Lateral Raise','Reverse Fly','Shrugs','Behind-Neck Press','Y-Raise'],
  Arms:     ['Preacher Curl','Cable Curl','Overhead Tricep Extension','Diamond Push-Up','Zottman Curl','EZ Bar Curl'],
  Legs:     ['Hack Squat','Bulgarian Split Squat','Seated Calf Raise','Glute Bridge','Box Jump','Sumo Deadlift'],
  Core:     ['Cable Woodchop','Bicycle Crunches','Hanging Knee Raise','Dead Bug','Pallof Press','Ab Rollout'],
}

function AddModal({ muscleGroup, onAdd, onClose }) {
  const [name,     setName]     = useState('')
  const [category, setCategory] = useState('')
  const [lbs,      setLbs]      = useState(0)
  const [reps,     setReps]     = useState(10)
  const [busy,     setBusy]     = useState(false)
  const inputRef = useRef(null)
  useEffect(() => { inputRef.current?.focus() }, [])

  async function go() {
    if (!name.trim()) return
    setBusy(true)
    await onAdd({ name: name.trim(), category: category.trim() || `CUSTOM / ${(muscleGroup || 'EXERCISE').toUpperCase()}`, sets_data: [{ set: 1, lbs: Number(lbs), reps: Number(reps) }] })
    setBusy(false); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-t-3xl p-5 pb-10" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: '#2A2A4A' }} />
        <h3 className="font-bold text-lg mb-4" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Add Exercise</h3>

        <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Name</label>
        <input ref={inputRef} value={name} onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && go()}
          placeholder="e.g. Bench Press"
          className="w-full mt-1 mb-3 px-3 py-2.5 rounded-xl outline-none text-sm"
          style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />

        <div className="flex flex-wrap gap-1.5 mb-3">
          {(SUGGESTIONS[muscleGroup] || []).map(s => (
            <button key={s} onClick={() => setName(s)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ background: name === s ? 'rgba(123,111,232,0.22)' : 'rgba(123,111,232,0.07)', color: name === s ? '#9B8FF8' : '#7A7A9A', border: `1px solid ${name === s ? 'rgba(123,111,232,0.4)' : '#2A2A4A'}` }}>
              {s}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Weight (lbs)</label>
            <input type="number" value={lbs} onChange={e => setLbs(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
          </div>
          <div>
            <label style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reps</label>
            <input type="number" value={reps} onChange={e => setReps(e.target.value)}
              className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none text-sm"
              style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }} />
          </div>
        </div>

        <button onClick={go} disabled={busy || !name.trim()}
          className="w-full py-3.5 rounded-xl font-bold text-white btn-purple disabled:opacity-40" style={{ fontSize: 15 }}>
          {busy ? 'Adding...' : 'Add to Workout'}
        </button>
        <button onClick={onClose} className="w-full mt-2 py-3 rounded-xl" style={{ color: '#4A4A6A', fontSize: 14 }}>Cancel</button>
      </div>
    </div>
  )
}

/* ─── Finish Modal ───────────────────────────────────── */
function FinishModal({ doneCount, total, time, onConfirm, onCancel, busy }) {
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0
  function fmt(s) { const m = Math.floor(s/60); return `${m}m ${s%60}s` }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6"
      style={{ background: 'rgba(0,0,0,0.82)' }}>
      <div className="w-full max-w-xs rounded-3xl p-6 text-center" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
        <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
          style={{ background: 'rgba(123,111,232,0.12)' }}>
          {pct === 100 ? '🏆' : pct >= 50 ? '💪' : '⚡'}
        </div>
        <h3 className="font-bold text-xl mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Finish workout?</h3>
        <p style={{ color: '#7A7A9A', fontSize: 13, marginBottom: 4 }}>
          {doneCount}/{total} exercises · {fmt(time)}
        </p>
        {doneCount < total && (
          <p style={{ color: '#EF9F27', fontSize: 12, marginBottom: 16 }}>
            {total - doneCount} exercise{total - doneCount > 1 ? 's' : ''} still remaining
          </p>
        )}
        <button onClick={onConfirm} disabled={busy}
          className="w-full py-3.5 rounded-xl font-bold text-white btn-purple mb-2 disabled:opacity-50" style={{ fontSize: 15 }}>
          {busy ? 'Saving...' : 'Save & Finish'}
        </button>
        <button onClick={onCancel} className="w-full py-3 rounded-xl" style={{ color: '#7A7A9A', fontSize: 14 }}>Keep going</button>
      </div>
    </div>
  )
}

/* ─── Main page ──────────────────────────────────────── */
export default function SessionPage() {
  const router  = useRouter()
  const { id }  = router.query
  const toast   = useToast()

  const [session,    setSession]    = useState(null)
  const [exercises,  setExercises]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [timer,      setTimer]      = useState(0)
  const [timerOn,    setTimerOn]    = useState(true)
  const [showAdd,    setShowAdd]    = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [finishing,  setFinishing]  = useState(false)
  const [restSecs,   setRestSecs]   = useState(null)
  const [userStreak, setUserStreak] = useState(0)
  const [userName, setUserName] = useState('Aarchi')
  const timerRef = useRef(null)

  /* ── Load user for streak ── */
  useEffect(() => {
    getToday().then(r => {
      setUserStreak(r.data?.user?.streak || 0)
      setUserName(r.data?.user?.name || 'Aarchi')
    }).catch(() => {})
  }, [])

  /* ── Timer ── */
  useEffect(() => {
    if (timerOn) timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    else clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [timerOn])

  /* ── Load ── */
  useEffect(() => {
    if (!router.isReady) return
    const muscle = router.query.muscle
    if (id === 'local') { buildLocal(muscle || 'Chest'); return }
    if (id) loadSession(id)
  }, [router.isReady, id])

  function buildLocal(muscle) {
    const split = getSavedSplit()
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
    const m = muscle || split[today] || 'Chest'
    setSession({ id: 'local', muscle_group: m })
    setExercises(getDefaultExercises(m))
    setLoading(false)
  }

  async function loadSession(sid) {
    try {
      const res = await getSession(sid)
      setSession(res.data.session)
      setExercises(res.data.exercises)
    } catch {
      const split  = getSavedSplit()
      const today  = new Date().toLocaleDateString('en-US', { weekday: 'long' })
      const muscle = router.query.muscle || split[today] || 'Chest'
      setSession({ id: 'local', muscle_group: muscle })
      setExercises(getDefaultExercises(muscle))
    } finally { setLoading(false) }
  }

  function getDefaultExercises(muscle) {
    const lib = {
      Chest:    [{ id:1, name:'Bench Press',     category:'COMPOUND / CHEST',    sets_data:[{set:1,lbs:135,reps:12},{set:2,lbs:185,reps:8}],  completed:false },
                 { id:2, name:'Incline DB Fly',   category:'ISOLATION / CHEST',   sets_data:[{set:1,lbs:45,reps:15}],                           completed:false }],
      Back:     [{ id:1, name:'Deadlift',         category:'COMPOUND / BACK',     sets_data:[{set:1,lbs:225,reps:5}],                            completed:false },
                 { id:2, name:'Lat Pulldown',     category:'ISOLATION / BACK',    sets_data:[{set:1,lbs:120,reps:12}],                           completed:false }],
      Shoulder: [{ id:1, name:'Overhead Press',   category:'COMPOUND / SHOULDER', sets_data:[{set:1,lbs:95,reps:8}],                             completed:false },
                 { id:2, name:'Lateral Raises',   category:'ISOLATION / SHOULDER',sets_data:[{set:1,lbs:25,reps:15}],                            completed:false }],
      Arms:     [{ id:1, name:'Barbell Curl',     category:'ISOLATION / BICEPS',  sets_data:[{set:1,lbs:65,reps:12}],                            completed:false },
                 { id:2, name:'Tricep Pushdown',  category:'ISOLATION / TRICEPS', sets_data:[{set:1,lbs:50,reps:15}],                            completed:false }],
      Legs:     [{ id:1, name:'Back Squat',       category:'COMPOUND / LEGS',     sets_data:[{set:1,lbs:185,reps:8}],                            completed:false },
                 { id:2, name:'Leg Press',        category:'COMPOUND / QUADS',    sets_data:[{set:1,lbs:270,reps:12}],                           completed:false }],
      Core:     [{ id:1, name:'Plank',            category:'COMPOUND / CORE',     sets_data:[{set:1,lbs:0,reps:60}],                             completed:false },
                 { id:2, name:'Cable Crunches',   category:'ISOLATION / ABS',     sets_data:[{set:1,lbs:50,reps:15}],                            completed:false }],
    }
    return (lib[muscle] || lib.Chest).map(e => ({ ...e, sets_data: e.sets_data.map(s => ({ ...s })) }))
  }

  function fmt(s) { return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}` }

  /* ── Exercise mutations ── */
  const updateSet = useCallback((exId, idx, field, val) => {
    setExercises(prev => prev.map(ex => ex.id !== exId ? ex : {
      ...ex, sets_data: ex.sets_data.map((s, i) => i !== idx ? s : { ...s, [field]: val })
    }))
  }, [])

  const toggleSet = useCallback((exId, idx) => {
    setExercises(prev => prev.map(ex => ex.id !== exId ? ex : {
      ...ex, sets_data: ex.sets_data.map((s, i) => i !== idx ? s : { ...s, _done: !s._done })
    }))
  }, [])

  const addSet = useCallback(exId => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex
      const last = ex.sets_data[ex.sets_data.length - 1] || { lbs: 0, reps: 10 }
      return { ...ex, sets_data: [...ex.sets_data, { set: ex.sets_data.length + 1, lbs: last.lbs, reps: last.reps }] }
    }))
  }, [])

  const deleteSet = useCallback((exId, idx) => {
    setExercises(prev => prev.map(ex => ex.id !== exId ? ex : {
      ...ex, sets_data: ex.sets_data.filter((_, i) => i !== idx).map((s, i) => ({ ...s, set: i + 1 }))
    }))
  }, [])

  const toggleDone = useCallback(exId => {
    setExercises(prev => prev.map(ex => {
      if (ex.id !== exId) return ex
      const next = !ex.completed
      if (next) toast(`${ex.name} completed! 💪`, 'success', 2000)
      return { ...ex, completed: next }
    }))
  }, [toast])

  const deleteEx = useCallback(exId => {
    setExercises(prev => prev.filter(ex => ex.id !== exId))
    toast('Exercise removed', 'info', 1500)
  }, [toast])

  async function handleAddEx(data) {
    if (session?.id && session.id !== 'local') {
      try {
        const res = await addExercise(session.id, data)
        setExercises(prev => [...prev, res.data])
        toast(`${data.name} added!`, 'success', 1800)
        return
      } catch {}
    }
    setExercises(prev => [...prev, { id: Date.now(), ...data, completed: false }])
    toast(`${data.name} added!`, 'success', 1800)
  }

  async function handleFinish() {
    setFinishing(true)
    try {
      if (session?.id && session.id !== 'local') {
        await Promise.allSettled(exercises.map(ex =>
          updateExercise(ex.id, { name: ex.name, category: ex.category, sets_data: ex.sets_data, completed: ex.completed })
        ))
        await completeSession(session.id, timer)
      }
      toast('Workout saved! Great session 🔥', 'success', 3000)
    } catch { toast('Saved locally', 'info', 2000) }
    router.push('/')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }} />
    </div>
  )

  const doneCount  = exercises.filter(e => e.completed).length
  const total      = exercises.length
  const muscle     = session?.muscle_group || 'Chest'
  const allDone    = total > 0 && doneCount === total

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-36">

        {/* Top bar */}
        <div className="flex items-center justify-between mb-5 animate-stagger-1">
          <button onClick={() => router.push('/')}
            className="flex items-center gap-2 transition-all hover:opacity-70" style={{ color: '#7A7A9A' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
              Obsidian Lens
            </span>
          </button>
          <StreakBadge streak={userStreak} />
        </div>

        {/* Timer */}
        <div className="text-center mb-5 animate-stagger-2">
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Session Duration
          </p>
          <div className="flex items-center justify-center gap-5">
            <button onClick={() => setTimerOn(v => !v)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}>
              {timerOn
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="#7B6FE8"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="#7B6FE8"><path d="M8 5v14l11-7z"/></svg>}
            </button>

            <span className={timerOn ? 'timer-active' : ''}
              style={{ fontFamily: 'Syne, sans-serif', fontSize: 52, color: '#E2E2F0', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmt(timer)}
            </span>

            <button onClick={() => setTimer(0)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:opacity-70"
              style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B6FE8" strokeWidth="2">
                <path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 .49-4"/>
              </svg>
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse-slow" style={{ background: '#E24B4A' }} />
            <span style={{ color: '#7A7A9A', fontSize: 12, fontWeight: 600 }}>{muscle.toUpperCase()} DAY</span>
          </div>
        </div>

        {/* Progress bar */}
        {total > 0 && (
          <div className="mb-4">
            <div className="flex justify-between mb-1.5">
              <span style={{ color: '#7A7A9A', fontSize: 11 }}>Exercises</span>
              <span style={{ color: allDone ? '#1D9E75' : '#7A7A9A', fontSize: 11, fontWeight: 600 }}>{doneCount} / {total}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A35' }}>
              <div className="h-1.5 rounded-full progress-bar"
                style={{ width: `${(doneCount / total) * 100}%`, background: allDone ? '#1D9E75' : '#7B6FE8', transition: 'width 0.4s, background 0.4s' }} />
            </div>
            {allDone && (
              <p className="text-center mt-2 text-xs font-bold" style={{ color: '#1D9E75' }}>
                🏆 All exercises done — great session!
              </p>
            )}
          </div>
        )}

        {/* Active exercises header */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>Active Exercises</span>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: 'rgba(123,111,232,0.1)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.22)' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5v14M5 12h14"/></svg>
            ADD
          </button>
        </div>

        {/* Exercise list */}
        {exercises.length === 0
          ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🏋️</div>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 12 }}>No exercises yet</p>
              <button onClick={() => setShowAdd(true)} className="px-6 py-3 rounded-xl font-bold text-white btn-purple">
                + Add First Exercise
              </button>
            </div>
          )
          : exercises.map(ex => (
            <ExerciseCard key={ex.id} ex={ex}
              onUpdateSet={updateSet}
              onAddSet={addSet}
              onDeleteSet={deleteSet}
              onToggleSet={toggleSet}
              onToggleDone={toggleDone}
              onDelete={deleteEx}
              onStartRest={secs => setRestSecs(secs)}
            />
          ))
        }

      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-0 right-0 px-4"
        style={{ background: 'linear-gradient(to top, #0D0D1A 65%, transparent)', paddingBottom: 'max(24px, env(safe-area-inset-bottom))', paddingTop: 24 }}>
        <div className="max-w-sm mx-auto">
          <button onClick={() => setShowFinish(true)}
            className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
            style={{ fontSize: 16, letterSpacing: '0.06em' }}>
            FINISH WORKOUT
          </button>
          <p className="text-center mt-2" style={{ color: '#4A4A6A', fontSize: 10, letterSpacing: '0.06em' }}>
            SESSION LOGGED AS {userName.toUpperCase()}
          </p>
        </div>
      </div>

      {/* Modals */}
      {showAdd    && <AddModal muscleGroup={muscle} onAdd={handleAddEx} onClose={() => setShowAdd(false)} />}
      {showFinish && <FinishModal doneCount={doneCount} total={total} time={timer} busy={finishing} onConfirm={handleFinish} onCancel={() => setShowFinish(false)} />}
      {restSecs   && <RestTimer seconds={restSecs} onDone={() => { setRestSecs(null); toast('Rest done — back to it! 💪', 'info', 2000) }} onSkip={() => setRestSecs(null)} />}
    </div>
  )
}
