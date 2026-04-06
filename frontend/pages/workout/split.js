import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../../components/BottomNav'
import { useToast } from '../../components/Toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MUSCLES = [
  { id: 'Chest',    icon: '🏋️', color: '#E24B4A', desc: 'Bench, flyes, dips'        },
  { id: 'Back',     icon: '🔙', color: '#7B6FE8', desc: 'Rows, pull-ups, deadlift'  },
  { id: 'Shoulder', icon: '💪', color: '#EF9F27', desc: 'Press, raises, face pulls'  },
  { id: 'Arms',     icon: '💪', color: '#1D9E75', desc: 'Curls, tricep extensions'   },
  { id: 'Legs',     icon: '🦵', color: '#378ADD', desc: 'Squat, leg press, lunges'   },
  { id: 'Core',     icon: '🔥', color: '#D4537E', desc: 'Planks, crunches, cable'    },
  { id: 'Rest',     icon: '😴', color: '#4A4A6A', desc: 'Recovery & mobility'        },
]

const STORAGE_KEY = 'ob_split'

const DEFAULT_SPLIT = {
  Monday: 'Chest',
  Tuesday: 'Back',
  Wednesday: 'Shoulder',
  Thursday: 'Arms',
  Friday: 'Legs',
  Saturday: 'Core',
  Sunday: 'Rest',
}

const PRESETS = [
  {
    name: 'Push / Pull / Legs',
    split: { Monday:'Chest', Tuesday:'Back', Wednesday:'Legs', Thursday:'Shoulder', Friday:'Arms', Saturday:'Core', Sunday:'Rest' },
  },
  {
    name: 'Bro Split (Classic)',
    split: { Monday:'Chest', Tuesday:'Back', Wednesday:'Shoulder', Thursday:'Arms', Friday:'Legs', Saturday:'Core', Sunday:'Rest' },
  },
  {
    name: 'Upper / Lower',
    split: { Monday:'Chest', Tuesday:'Legs', Wednesday:'Back', Thursday:'Legs', Friday:'Shoulder', Saturday:'Arms', Sunday:'Rest' },
  },
  {
    name: '5-Day Full Body',
    split: { Monday:'Chest', Tuesday:'Back', Wednesday:'Rest', Thursday:'Legs', Friday:'Shoulder', Saturday:'Arms', Sunday:'Rest' },
  },
]

export default function SplitPage() {
  const router = useRouter()
  const toast  = useToast()
  const [split, setSplit] = useState(DEFAULT_SPLIT)
  const [editing, setEditing] = useState(null) // day being edited

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setSplit(JSON.parse(saved))
    } catch {}
  }, [])

  function assignMuscle(day, muscle) {
    const next = { ...split, [day]: muscle }
    setSplit(next)
    setEditing(null)
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(split))
      toast('Workout split saved!', 'success')
    } catch {
      toast('Saved locally', 'info')
    }
  }

  function applyPreset(preset) {
    setSplit(preset.split)
    toast(`"${preset.name}" applied`, 'info')
  }

  const getColor = (muscle) => MUSCLES.find(m => m.id === muscle)?.color || '#7B6FE8'
  const getIcon  = (muscle) => MUSCLES.find(m => m.id === muscle)?.icon  || '💪'

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
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Customize</p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Workout Split</h1>
            </div>
          </div>
          <button onClick={save} className="px-4 py-2 rounded-xl font-bold text-white btn-purple text-sm">
            Save
          </button>
        </div>

        {/* Weekly grid visual */}
        <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Your week — tap a day to change
          </p>
          <div className="grid grid-cols-7 gap-1.5 mb-3">
            {DAYS.map((day, i) => {
              const muscle = split[day] || 'Rest'
              const color  = getColor(muscle)
              const icon   = getIcon(muscle)
              const isEdit = editing === day
              return (
                <button
                  key={day}
                  onClick={() => setEditing(isEdit ? null : day)}
                  className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-90"
                  style={{
                    background: isEdit ? `${color}22` : `${color}10`,
                    border: `1.5px solid ${isEdit ? color : `${color}33`}`,
                  }}
                >
                  <span style={{ fontSize: 14 }}>{icon}</span>
                  <span style={{ color: '#4A4A6A', fontSize: 8, fontWeight: 600 }}>{DAY_SHORT[i]}</span>
                  <span style={{ color, fontSize: 7, fontWeight: 700, letterSpacing: '0.03em' }}>
                    {muscle === 'Rest' ? 'REST' : muscle.toUpperCase().slice(0, 3)}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Inline muscle picker */}
          {editing && (
            <div className="animate-stagger-1">
              <p style={{ color: '#7A7A9A', fontSize: 11, marginBottom: 8 }}>
                Assign <span style={{ color: '#E2E2F0', fontWeight: 600 }}>{editing}</span>:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {MUSCLES.map(m => (
                  <button
                    key={m.id}
                    onClick={() => assignMuscle(editing, m.id)}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl text-left transition-all active:scale-95 hover:opacity-80"
                    style={{
                      background: split[editing] === m.id ? `${m.color}18` : '#1A1A35',
                      border: `1px solid ${split[editing] === m.id ? m.color : '#2A2A4A'}`,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>{m.icon}</span>
                    <div>
                      <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600 }}>{m.id}</p>
                      <p style={{ color: '#4A4A6A', fontSize: 9, marginTop: 1 }}>{m.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Presets */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Apply a preset
          </p>
          <div className="flex flex-col gap-2">
            {PRESETS.map(p => (
              <button
                key={p.name}
                onClick={() => applyPreset(p)}
                className="flex items-center justify-between p-3.5 rounded-xl text-left transition-all active:scale-95 hover:opacity-80"
                style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}
              >
                <div>
                  <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 600 }}>{p.name}</p>
                  <p style={{ color: '#4A4A6A', fontSize: 10, marginTop: 2 }}>
                    {Object.values(p.split).filter(m => m !== 'Rest').join(' · ')}
                  </p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B6FE8" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Current split table */}
        <div className="rounded-2xl p-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Current split
          </p>
          {DAYS.map((day, i) => {
            const muscle = split[day] || 'Rest'
            const color  = getColor(muscle)
            return (
              <div key={day} className="flex items-center justify-between py-2.5"
                style={{ borderBottom: i < 6 ? '1px solid #1A1A35' : 'none' }}>
                <span style={{ color: '#7A7A9A', fontSize: 13 }}>{DAY_SHORT[i]}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 600 }}>{muscle}</span>
                </div>
              </div>
            )
          })}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
