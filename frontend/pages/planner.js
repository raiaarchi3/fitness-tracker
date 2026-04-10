import { useState } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../../components/BottomNav'
import { useToast } from '../../components/Toast'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// ── Full exercise library with beginner/intermediate/advanced weights ──
const EXERCISE_LIBRARY = {
  Chest: [
    { name: 'Barbell Bench Press',  category: 'COMPOUND / CHEST',         lbs: { beginner: 65,  intermediate: 135, advanced: 185 }, reps: { beginner: 10, intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Incline DB Press',     category: 'COMPOUND / UPPER CHEST',   lbs: { beginner: 25,  intermediate: 50,  advanced: 70  }, reps: { beginner: 12, intermediate: 10, advanced: 8  }, sets: 3 },
    { name: 'Cable Flyes',          category: 'ISOLATION / CHEST',        lbs: { beginner: 15,  intermediate: 30,  advanced: 45  }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
    { name: 'Chest Dips',           category: 'COMPOUND / CHEST',         lbs: { beginner: 0,   intermediate: 0,   advanced: 25  }, reps: { beginner: 8,  intermediate: 10, advanced: 12 }, sets: 3 },
    { name: 'Push-Ups',             category: 'COMPOUND / CHEST',         lbs: { beginner: 0,   intermediate: 0,   advanced: 0   }, reps: { beginner: 15, intermediate: 20, advanced: 30 }, sets: 3 },
    { name: 'Pec Deck Machine',     category: 'ISOLATION / CHEST',        lbs: { beginner: 40,  intermediate: 70,  advanced: 100 }, reps: { beginner: 15, intermediate: 12, advanced: 10 }, sets: 3 },
  ],
  Back: [
    { name: 'Deadlift',             category: 'COMPOUND / BACK',          lbs: { beginner: 95,  intermediate: 185, advanced: 275 }, reps: { beginner: 8,  intermediate: 5,  advanced: 4  }, sets: 3 },
    { name: 'Lat Pulldown',         category: 'ISOLATION / BACK',         lbs: { beginner: 60,  intermediate: 110, advanced: 150 }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Bent-Over Row',        category: 'COMPOUND / BACK',          lbs: { beginner: 65,  intermediate: 115, advanced: 165 }, reps: { beginner: 10, intermediate: 8,  advanced: 8  }, sets: 3 },
    { name: 'Seated Cable Row',     category: 'COMPOUND / BACK',          lbs: { beginner: 50,  intermediate: 100, advanced: 140 }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Pull-Ups',             category: 'COMPOUND / BACK',          lbs: { beginner: 0,   intermediate: 0,   advanced: 25  }, reps: { beginner: 5,  intermediate: 8,  advanced: 12 }, sets: 3 },
    { name: 'Face Pulls',           category: 'ISOLATION / REAR DELT',    lbs: { beginner: 20,  intermediate: 40,  advanced: 60  }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
  ],
  Shoulder: [
    { name: 'Overhead Press',       category: 'COMPOUND / SHOULDER',      lbs: { beginner: 45,  intermediate: 85,  advanced: 135 }, reps: { beginner: 10, intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Lateral Raises',       category: 'ISOLATION / SIDE DELT',    lbs: { beginner: 10,  intermediate: 20,  advanced: 35  }, reps: { beginner: 15, intermediate: 15, advanced: 12 }, sets: 3 },
    { name: 'Front Raises',         category: 'ISOLATION / FRONT DELT',   lbs: { beginner: 10,  intermediate: 20,  advanced: 30  }, reps: { beginner: 12, intermediate: 12, advanced: 10 }, sets: 3 },
    { name: 'Arnold Press',         category: 'COMPOUND / SHOULDER',      lbs: { beginner: 15,  intermediate: 30,  advanced: 45  }, reps: { beginner: 12, intermediate: 10, advanced: 8  }, sets: 3 },
    { name: 'Reverse Flyes',        category: 'ISOLATION / REAR DELT',    lbs: { beginner: 10,  intermediate: 20,  advanced: 30  }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
    { name: 'Upright Row',          category: 'COMPOUND / SHOULDER',      lbs: { beginner: 35,  intermediate: 65,  advanced: 95  }, reps: { beginner: 12, intermediate: 10, advanced: 8  }, sets: 3 },
  ],
  Arms: [
    { name: 'Barbell Curl',         category: 'ISOLATION / BICEPS',       lbs: { beginner: 30,  intermediate: 60,  advanced: 90  }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Hammer Curls',         category: 'ISOLATION / BICEPS',       lbs: { beginner: 15,  intermediate: 30,  advanced: 45  }, reps: { beginner: 12, intermediate: 12, advanced: 10 }, sets: 3 },
    { name: 'Tricep Pushdown',      category: 'ISOLATION / TRICEPS',      lbs: { beginner: 30,  intermediate: 55,  advanced: 80  }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
    { name: 'Skull Crushers',       category: 'ISOLATION / TRICEPS',      lbs: { beginner: 30,  intermediate: 60,  advanced: 90  }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Preacher Curl',        category: 'ISOLATION / BICEPS',       lbs: { beginner: 25,  intermediate: 50,  advanced: 75  }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Overhead Tricep Ext',  category: 'ISOLATION / TRICEPS',      lbs: { beginner: 20,  intermediate: 40,  advanced: 65  }, reps: { beginner: 15, intermediate: 12, advanced: 10 }, sets: 3 },
  ],
  Legs: [
    { name: 'Back Squat',           category: 'COMPOUND / QUADS',         lbs: { beginner: 65,  intermediate: 155, advanced: 245 }, reps: { beginner: 10, intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Leg Press',            category: 'COMPOUND / QUADS',         lbs: { beginner: 90,  intermediate: 200, advanced: 350 }, reps: { beginner: 12, intermediate: 10, advanced: 10 }, sets: 3 },
    { name: 'Romanian Deadlift',    category: 'COMPOUND / HAMSTRINGS',    lbs: { beginner: 65,  intermediate: 135, advanced: 205 }, reps: { beginner: 10, intermediate: 10, advanced: 8  }, sets: 3 },
    { name: 'Leg Extension',        category: 'ISOLATION / QUADS',        lbs: { beginner: 50,  intermediate: 90,  advanced: 130 }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
    { name: 'Leg Curl',             category: 'ISOLATION / HAMSTRINGS',   lbs: { beginner: 40,  intermediate: 75,  advanced: 110 }, reps: { beginner: 15, intermediate: 12, advanced: 12 }, sets: 3 },
    { name: 'Standing Calf Raises', category: 'ISOLATION / CALVES',       lbs: { beginner: 50,  intermediate: 100, advanced: 160 }, reps: { beginner: 20, intermediate: 15, advanced: 15 }, sets: 3 },
  ],
  Core: [
    { name: 'Plank',                category: 'COMPOUND / CORE',          lbs: { beginner: 0,   intermediate: 0,   advanced: 0   }, reps: { beginner: 30, intermediate: 60, advanced: 90 }, sets: 3 },
    { name: 'Cable Crunches',       category: 'ISOLATION / ABS',          lbs: { beginner: 30,  intermediate: 55,  advanced: 80  }, reps: { beginner: 15, intermediate: 15, advanced: 15 }, sets: 3 },
    { name: 'Leg Raises',           category: 'ISOLATION / LOWER ABS',    lbs: { beginner: 0,   intermediate: 0,   advanced: 0   }, reps: { beginner: 12, intermediate: 15, advanced: 20 }, sets: 3 },
    { name: 'Russian Twists',       category: 'ISOLATION / OBLIQUES',     lbs: { beginner: 10,  intermediate: 25,  advanced: 45  }, reps: { beginner: 20, intermediate: 20, advanced: 20 }, sets: 3 },
    { name: 'Ab Wheel Rollout',     category: 'COMPOUND / CORE',          lbs: { beginner: 0,   intermediate: 0,   advanced: 0   }, reps: { beginner: 8,  intermediate: 12, advanced: 15 }, sets: 3 },
    { name: 'Bicycle Crunches',     category: 'ISOLATION / ABS',          lbs: { beginner: 0,   intermediate: 0,   advanced: 0   }, reps: { beginner: 20, intermediate: 30, advanced: 40 }, sets: 3 },
  ],
  'Full Body': [
    { name: 'Back Squat',           category: 'COMPOUND / LEGS',          lbs: { beginner: 65,  intermediate: 135, advanced: 185 }, reps: { beginner: 8,  intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Bench Press',          category: 'COMPOUND / CHEST',         lbs: { beginner: 65,  intermediate: 115, advanced: 155 }, reps: { beginner: 8,  intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Bent-Over Row',        category: 'COMPOUND / BACK',          lbs: { beginner: 55,  intermediate: 95,  advanced: 135 }, reps: { beginner: 8,  intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Overhead Press',       category: 'COMPOUND / SHOULDER',      lbs: { beginner: 35,  intermediate: 65,  advanced: 95  }, reps: { beginner: 8,  intermediate: 8,  advanced: 6  }, sets: 3 },
    { name: 'Romanian Deadlift',    category: 'COMPOUND / HAMSTRINGS',    lbs: { beginner: 65,  intermediate: 115, advanced: 155 }, reps: { beginner: 10, intermediate: 8,  advanced: 8  }, sets: 3 },
  ],
}

// ── Plan generator logic ──────────────────────────────────────────────
function generatePlan({ days, goal, experience, preferences, bodyWeight }) {
  const workoutDays = parseInt(days)
  const restDays = 7 - workoutDays

  // Choose which muscles to hit based on days available
  const splits = {
    1: ['Full Body'],
    2: ['Full Body', 'Full Body'],
    3: ['Push', 'Pull', 'Legs'],
    4: ['Chest', 'Back', 'Shoulder', 'Legs'],
    5: ['Chest', 'Back', 'Shoulder', 'Arms', 'Legs'],
    6: ['Chest', 'Back', 'Shoulder', 'Arms', 'Legs', 'Core'],
  }

  // Map Push/Pull to muscle groups
  const muscleMap = {
    'Push':  ['Chest', 'Shoulder', 'Arms'],
    'Pull':  ['Back', 'Arms'],
    'Legs':  ['Legs'],
  }

  const splitTemplate = splits[workoutDays] || splits[3]

  // Distribute across the week
  const schedule = {}
  let workoutIdx = 0

  DAYS.forEach((day, i) => {
    if (workoutIdx < splitTemplate.length) {
      const muscle = splitTemplate[workoutIdx]
      // Spread rest days evenly
      const shouldRest = workoutIdx > 2 && (i % 3 === 2) && workoutIdx < splitTemplate.length

      if (muscle === 'Push') {
        schedule[day] = {
          muscle: 'Push Day',
          muscles: ['Chest', 'Shoulder', 'Arms'],
          exercises: buildExercises(['Chest', 'Shoulder', 'Arms'], experience, goal, bodyWeight, 2),
        }
      } else if (muscle === 'Pull') {
        schedule[day] = {
          muscle: 'Pull Day',
          muscles: ['Back', 'Arms'],
          exercises: buildExercises(['Back', 'Arms'], experience, goal, bodyWeight, 3),
        }
      } else {
        schedule[day] = {
          muscle,
          muscles: [muscle],
          exercises: buildExercises([muscle], experience, goal, bodyWeight, 5),
        }
      }
      workoutIdx++
    } else {
      schedule[day] = { muscle: 'Rest', muscles: [], exercises: [] }
    }
  })

  return schedule
}

function buildExercises(muscles, experience, goal, bodyWeight, countPerMuscle) {
  const level = experience || 'beginner'
  const exercises = []
  let id = 1

  muscles.forEach(muscle => {
    const pool = EXERCISE_LIBRARY[muscle] || []
    // Pick exercises based on goal
    let selected
    if (goal === 'strength') {
      // Prioritize compound movements
      selected = [...pool].sort((a, b) => {
        const aIsCompound = a.category.includes('COMPOUND') ? 0 : 1
        const bIsCompound = b.category.includes('COMPOUND') ? 0 : 1
        return aIsCompound - bIsCompound
      }).slice(0, countPerMuscle)
    } else if (goal === 'tone') {
      // Mix compound + isolation, higher reps
      selected = pool.slice(0, countPerMuscle)
    } else {
      // muscle gain - balanced
      selected = pool.slice(0, countPerMuscle)
    }

    selected.forEach(ex => {
      let weight = ex.lbs[level] || 0

      // Adjust weight by body weight ratio if provided
      if (bodyWeight && ex.lbs[level] > 0) {
        const ratio = bodyWeight / 70 // normalize to 70kg person
        weight = Math.round(ex.lbs[level] * ratio / 5) * 5
      }

      // Adjust reps based on goal
      let reps = ex.reps[level]
      let sets = ex.sets
      if (goal === 'strength') { reps = Math.max(reps - 3, 3); sets = 4 }
      if (goal === 'tone')     { reps = reps + 3; sets = 3 }
      if (goal === 'endurance'){ reps = reps + 5; sets = 3 }

      exercises.push({
        id,
        name: ex.name,
        category: ex.category,
        sets_data: Array.from({ length: sets }, (_, i) => ({
          set: i + 1,
          lbs: weight,
          reps,
        })),
        completed: false,
      })
      id++
    })
  })

  return exercises
}

// ── UI Components ─────────────────────────────────────────────────────

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="rounded-full flex items-center justify-center text-xs font-bold transition-all"
            style={{
              width: 28, height: 28,
              background: i < current ? '#7B6FE8' : i === current ? '#7B6FE8' : '#1A1A35',
              color: i <= current ? '#fff' : '#4A4A6A',
              border: i === current ? '2px solid #9B8FF8' : 'none',
            }}
          >
            {i < current ? '✓' : i + 1}
          </div>
          {i < total - 1 && (
            <div className="h-0.5 w-6 rounded" style={{ background: i < current ? '#7B6FE8' : '#1A1A35' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function OptionButton({ selected, onClick, icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl text-left transition-all w-full active:scale-95"
      style={{
        background: selected ? 'rgba(123,111,232,0.12)' : '#1A1A35',
        border: `1.5px solid ${selected ? '#7B6FE8' : '#2A2A4A'}`,
      }}
    >
      <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
      <div className="flex-1">
        <p style={{ color: '#E2E2F0', fontSize: 14, fontWeight: 600 }}>{label}</p>
        {sub && <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 2 }}>{sub}</p>}
      </div>
      {selected && (
        <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#7B6FE8' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      )}
    </button>
  )
}

function DayCard({ day, dayShort, plan, onToggleRest }) {
  const [open, setOpen] = useState(false)
  const isRest = plan.muscle === 'Rest'

  const COLORS = {
    'Chest': '#E24B4A', 'Back': '#7B6FE8', 'Shoulder': '#EF9F27',
    'Arms': '#1D9E75', 'Legs': '#378ADD', 'Core': '#D4537E',
    'Full Body': '#9B8FF8', 'Push Day': '#E24B4A', 'Pull Day': '#7B6FE8',
    'Rest': '#4A4A6A',
  }
  const color = COLORS[plan.muscle] || '#7B6FE8'

  return (
    <div className="rounded-2xl mb-3 overflow-hidden"
      style={{ background: '#13132A', border: `1px solid ${isRest ? '#2A2A4A' : color + '44'}` }}>

      {/* Header */}
      <div className="flex items-center gap-3 p-3.5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}15` }}>
          <span style={{ fontSize: 18 }}>
            {isRest ? '😴' : plan.muscle === 'Full Body' ? '⚡' :
             plan.muscle === 'Push Day' ? '💪' : plan.muscle === 'Pull Day' ? '🔙' :
             plan.muscle === 'Chest' ? '🏋️' : plan.muscle === 'Back' ? '🔙' :
             plan.muscle === 'Shoulder' ? '💪' : plan.muscle === 'Arms' ? '💪' :
             plan.muscle === 'Legs' ? '🦵' : '🔥'}
          </span>
        </div>
        <div className="flex-1">
          <p style={{ color: '#4A4A6A', fontSize: 10, fontWeight: 600 }}>{day.toUpperCase()}</p>
          <p style={{ color: '#E2E2F0', fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{plan.muscle}</p>
          {!isRest && (
            <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>
              {plan.exercises.length} exercises
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleRest(day)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: isRest ? 'rgba(29,158,117,0.1)' : 'rgba(226,75,74,0.08)',
              color: isRest ? '#1D9E75' : '#E24B4A',
              border: `1px solid ${isRest ? 'rgba(29,158,117,0.2)' : 'rgba(226,75,74,0.15)'}`,
            }}
          >
            {isRest ? 'Make active' : 'Set rest'}
          </button>
          {!isRest && (
            <button onClick={() => setOpen(v => !v)}
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: '#1A1A35' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7A7A9A" strokeWidth="2">
                {open ? <path d="M18 15l-6-6-6 6" /> : <path d="M6 9l6 6 6-6" />}
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Exercises */}
      {!isRest && open && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #1A1A35' }}>
          <div className="mt-3 flex flex-col gap-2">
            {plan.exercises.map((ex, i) => (
              <div key={i} className="flex items-center justify-between p-2.5 rounded-xl"
                style={{ background: '#1A1A35' }}>
                <div>
                  <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600 }}>{ex.name}</p>
                  <p style={{ color: '#4A4A6A', fontSize: 10, marginTop: 1 }}>{ex.category}</p>
                </div>
                <div className="text-right">
                  <p style={{ color, fontSize: 12, fontWeight: 700 }}>
                    {ex.sets_data.length} × {ex.sets_data[0]?.reps} reps
                  </p>
                  <p style={{ color: '#7A7A9A', fontSize: 11 }}>
                    {ex.sets_data[0]?.lbs > 0 ? `${ex.sets_data[0].lbs} lbs` : 'Bodyweight'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function PlanGeneratorPage() {
  const router = useRouter()
  const toast  = useToast()

  const [step, setStep] = useState(0) // 0-4 = wizard steps, 5 = result
  const [form, setForm] = useState({
    days:        '4',
    goal:        '',
    experience:  '',
    focus:       [],
    bodyWeight:  '',
    name:        '',
  })
  const [plan, setPlan]       = useState(null)
  const [planName, setPlanName] = useState('')

  const STEPS = ['Days', 'Goal', 'Level', 'Details', 'Review']

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }

  function toggleFocus(muscle) {
    setForm(p => ({
      ...p,
      focus: p.focus.includes(muscle)
        ? p.focus.filter(m => m !== muscle)
        : [...p.focus, muscle],
    }))
  }

  function handleGenerate() {
    const generated = generatePlan({
      days:        form.days,
      goal:        form.goal,
      experience:  form.experience,
      preferences: form.focus,
      bodyWeight:  form.bodyWeight ? parseFloat(form.bodyWeight) * 2.205 : null, // kg to lbs
    })
    setPlan(generated)
    setStep(5)
  }

  function handleToggleRest(day) {
    setPlan(prev => ({
      ...prev,
      [day]: prev[day].muscle === 'Rest'
        ? { muscle: 'Full Body', muscles: ['Full Body'], exercises: buildExercises(['Full Body'], form.experience, form.goal, null, 5) }
        : { muscle: 'Rest', muscles: [], exercises: [] }
    }))
  }

  function handleSave() {
    try {
      // Save split to localStorage so the main app uses it
      const split = {}
      DAYS.forEach(day => { split[day] = plan[day].muscle })
      localStorage.setItem('ob_split', JSON.stringify(split))

      // Save full plan with exercises
      localStorage.setItem('ob_generated_plan', JSON.stringify({
        name: planName || `My ${form.days}-Day Plan`,
        created: new Date().toISOString(),
        form,
        plan,
      }))

      toast('Plan saved! Your workout split is updated 🔥', 'success', 3000)
      setTimeout(() => router.push('/'), 1500)
    } catch {
      toast('Saved locally', 'info')
    }
  }

  // ── Wizard Steps ──────────────────────────────────────────────────
  const canNext = [
    true,              // step 0: days always valid
    !!form.goal,       // step 1: goal required
    !!form.experience, // step 2: experience required
    true,              // step 3: details optional
    true,              // step 4: review
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => step > 0 ? setStep(s => s - 1) : router.push('/workout/split')}
            style={{ color: '#7A7A9A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              {step < 5 ? `Step ${step + 1} of 5` : 'Your plan'}
            </p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              {step < 5 ? 'Build Your Plan' : 'Generated Plan'}
            </h1>
          </div>
        </div>

        {step < 5 && <StepIndicator current={step} total={5} />}

        {/* ── STEP 0: How many days? ── */}
        {step === 0 && (
          <div className="animate-stagger-1">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              How many days per week?
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              Be realistic — consistency matters more than quantity. Even 3 days done properly beats 6 days half-done.
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { val: '1', icon: '🌱', label: '1 day/week',  sub: 'Just getting started' },
                { val: '2', icon: '🔄', label: '2 days/week', sub: 'Busy schedule, still effective' },
                { val: '3', icon: '💪', label: '3 days/week', sub: 'Classic Push / Pull / Legs split' },
                { val: '4', icon: '🔥', label: '4 days/week', sub: 'Great for muscle gain and fat loss' },
                { val: '5', icon: '⚡', label: '5 days/week', sub: 'Dedicated training schedule' },
                { val: '6', icon: '🏆', label: '6 days/week', sub: 'Advanced athletes only' },
              ].map(opt => (
                <OptionButton key={opt.val}
                  selected={form.days === opt.val}
                  onClick={() => set('days', opt.val)}
                  icon={opt.icon} label={opt.label} sub={opt.sub} />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 1: Goal ── */}
        {step === 1 && (
          <div className="animate-stagger-1">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              What is your main goal?
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              This decides how many sets, reps and what exercises you get.
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { val: 'muscle',   icon: '💪', label: 'Build muscle',   sub: 'Moderate weight, 8–12 reps, compound movements' },
                { val: 'strength', icon: '🏋️', label: 'Get stronger',   sub: 'Heavy weight, 3–6 reps, powerlifting focus' },
                { val: 'tone',     icon: '✨', label: 'Tone up',         sub: 'Lighter weight, 12–15 reps, more isolation' },
                { val: 'fat_loss', icon: '🔥', label: 'Lose fat',        sub: 'Higher volume, shorter rest, cardio friendly' },
                { val: 'endurance',icon: '🏃', label: 'Build endurance', sub: 'High reps, lighter weights, full body' },
                { val: 'general',  icon: '⚖️', label: 'Stay fit',        sub: 'Balanced routine, overall health and fitness' },
              ].map(opt => (
                <OptionButton key={opt.val}
                  selected={form.goal === opt.val}
                  onClick={() => set('goal', opt.val)}
                  icon={opt.icon} label={opt.label} sub={opt.sub} />
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Experience ── */}
        {step === 2 && (
          <div className="animate-stagger-1">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              What is your experience level?
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              This sets the starting weights for each exercise.
            </p>

            <div className="flex flex-col gap-2.5 mb-6">
              {[
                { val: 'beginner',     icon: '🌱', label: 'Beginner',     sub: 'Less than 1 year of training' },
                { val: 'intermediate', icon: '💪', label: 'Intermediate', sub: '1–3 years of consistent training' },
                { val: 'advanced',     icon: '🏆', label: 'Advanced',     sub: '3+ years, know your lifts well' },
              ].map(opt => (
                <OptionButton key={opt.val}
                  selected={form.experience === opt.val}
                  onClick={() => set('experience', opt.val)}
                  icon={opt.icon} label={opt.label} sub={opt.sub} />
              ))}
            </div>

            {/* Experience guide */}
            <div className="rounded-2xl p-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                Example starting weights (bench press)
              </p>
              {[
                { level: 'Beginner',     weight: '65 lbs',  color: '#1D9E75' },
                { level: 'Intermediate', weight: '135 lbs', color: '#EF9F27' },
                { level: 'Advanced',     weight: '185 lbs', color: '#E24B4A' },
              ].map(r => (
                <div key={r.level} className="flex justify-between py-1.5"
                  style={{ borderBottom: '1px solid #1A1A35' }}>
                  <span style={{ color: '#7A7A9A', fontSize: 12 }}>{r.level}</span>
                  <span style={{ color: r.color, fontSize: 12, fontWeight: 700 }}>{r.weight}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 3: Details ── */}
        {step === 3 && (
          <div className="animate-stagger-1">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              A few more details
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Optional but helps personalise weights to your body.
            </p>

            {/* Body weight */}
            <div className="mb-4">
              <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Your body weight (kg) — optional
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="number" value={form.bodyWeight}
                  onChange={e => set('bodyWeight', e.target.value)}
                  placeholder="e.g. 70"
                  className="flex-1 px-3 py-3 rounded-xl outline-none text-sm"
                  style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
                />
                <span style={{ color: '#7A7A9A', fontSize: 13 }}>kg</span>
              </div>
              <p style={{ color: '#4A4A6A', fontSize: 11, marginTop: 6 }}>
                Used to scale exercise weights proportionally to your body
              </p>
            </div>

            {/* Muscle focus */}
            <div className="mb-4">
              <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 10 }}>
                Any muscle groups to prioritise? (optional)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Chest', 'Back', 'Shoulder', 'Arms', 'Legs', 'Core'].map(m => {
                  const selected = form.focus.includes(m)
                  return (
                    <button key={m} onClick={() => toggleFocus(m)}
                      className="py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                      style={{
                        background: selected ? 'rgba(123,111,232,0.15)' : '#13132A',
                        color:      selected ? '#9B8FF8' : '#7A7A9A',
                        border: `1px solid ${selected ? '#7B6FE8' : '#2A2A4A'}`,
                      }}>
                      {m}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Plan name */}
            <div>
              <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Name your plan (optional)
              </label>
              <input
                value={planName}
                onChange={e => setPlanName(e.target.value)}
                placeholder={`My ${form.days}-Day ${form.goal === 'muscle' ? 'Muscle' : form.goal === 'strength' ? 'Strength' : 'Fitness'} Plan`}
                className="w-full mt-1.5 px-3 py-3 rounded-xl outline-none text-sm"
                style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
              />
            </div>
          </div>
        )}

        {/* ── STEP 4: Review before generating ── */}
        {step === 4 && (
          <div className="animate-stagger-1">
            <h2 className="font-bold text-2xl mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
              Ready to generate!
            </h2>
            <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 20 }}>
              Here's what your plan will be based on:
            </p>

            <div className="rounded-2xl p-4 mb-6" style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
              {[
                { label: 'Training days',   val: `${form.days} days/week` },
                { label: 'Goal',            val: { muscle: 'Build Muscle', strength: 'Get Stronger', tone: 'Tone Up', fat_loss: 'Lose Fat', endurance: 'Build Endurance', general: 'Stay Fit' }[form.goal] },
                { label: 'Experience',      val: form.experience?.charAt(0).toUpperCase() + form.experience?.slice(1) },
                { label: 'Body weight',     val: form.bodyWeight ? `${form.bodyWeight} kg` : 'Not provided' },
                { label: 'Muscle focus',    val: form.focus.length ? form.focus.join(', ') : 'Balanced (all groups)' },
                { label: 'Plan name',       val: planName || `My ${form.days}-Day Plan` },
              ].map((r, i, arr) => (
                <div key={r.label} className="flex justify-between py-2.5"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #1A1A35' : 'none' }}>
                  <span style={{ color: '#7A7A9A', fontSize: 13 }}>{r.label}</span>
                  <span style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 600 }}>{r.val}</span>
                </div>
              ))}
            </div>

            <button onClick={handleGenerate}
              className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
              style={{ fontSize: 16 }}>
              ⚡ Generate My Plan
            </button>
          </div>
        )}

        {/* ── STEP 5: Generated Plan ── */}
        {step === 5 && plan && (
          <div className="animate-stagger-1">
            {/* Plan summary */}
            <div className="rounded-2xl p-4 mb-4 card-glow" style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                Your personalised plan
              </p>
              <h2 className="font-bold text-xl mb-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                {planName || `My ${form.days}-Day Plan`}
              </h2>
              <div className="flex gap-3 flex-wrap">
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(123,111,232,0.1)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.2)' }}>
                  {form.days} days/week
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(239,159,39,0.1)', color: '#EF9F27', border: '1px solid rgba(239,159,39,0.2)' }}>
                  {form.experience}
                </span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: 'rgba(29,158,117,0.1)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.2)' }}>
                  {form.goal?.replace('_', ' ')}
                </span>
              </div>
            </div>

            <p style={{ color: '#7A7A9A', fontSize: 12, marginBottom: 12 }}>
              Tap a day to see exercises · Toggle rest days as needed
            </p>

            {/* Day cards */}
            {DAYS.map(day => (
              <DayCard key={day} day={day} dayShort={DAY_SHORT[DAYS.indexOf(day)]}
                plan={plan[day]} onToggleRest={handleToggleRest} />
            ))}

            {/* Save button */}
            <div className="mt-4">
              <button onClick={handleSave}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple mb-3"
                style={{ fontSize: 16 }}>
                ✓ Save & Use This Plan
              </button>
              <button onClick={() => setStep(0)}
                className="w-full py-3 rounded-2xl font-semibold transition-all hover:opacity-80"
                style={{ background: '#13132A', color: '#7A7A9A', border: '1px solid #2A2A4A', fontSize: 14 }}>
                ↺ Generate a different plan
              </button>
            </div>
          </div>
        )}

        {/* Next button (wizard steps only) */}
        {step < 5 && (
          <button
            onClick={() => step === 4 ? handleGenerate() : setStep(s => s + 1)}
            disabled={!canNext[step]}
            className="w-full py-4 rounded-2xl font-bold text-white btn-purple disabled:opacity-30 mt-2"
            style={{ fontSize: 16 }}>
            {step === 4 ? '⚡ Generate My Plan' : 'Continue →'}
          </button>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
