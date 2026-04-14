import { useState } from 'react'
import { useRouter } from 'next/router'
import { completeSetup } from '../lib/api'

const GOALS = [
  { value: 'gain',     icon: '💪', label: 'Build Muscle',  desc: '+300 kcal surplus' },
  { value: 'cut',      icon: '🔥', label: 'Lose Fat',      desc: '−400 kcal deficit' },
  { value: 'maintain', icon: '⚖️', label: 'Stay Fit',      desc: 'Maintenance calories' },
  { value: 'strength', icon: '🏋️', label: 'Get Stronger', desc: 'Heavy compound lifts' },
]

const ACTIVITIES = [
  { value: '1.2',   label: 'Sedentary',    desc: 'Desk job, little exercise' },
  { value: '1.375', label: 'Light',        desc: '1–2 workouts/week' },
  { value: '1.55',  label: 'Moderate',     desc: '3–5 workouts/week' },
  { value: '1.725', label: 'Very Active',  desc: '6–7 workouts/week' },
]

const STEPS = ['welcome', 'personal', 'goal', 'activity', 'done']

function StepDots({ current }) {
  return (
    <div className="flex gap-2 justify-center mb-8">
      {STEPS.slice(1, 4).map((_, i) => (
        <div key={i} className="rounded-full transition-all duration-300"
          style={{
            width: i + 1 === current ? 24 : 8,
            height: 8,
            background: i + 1 <= current ? '#7B6FE8' : 'rgba(123,111,232,0.2)',
          }} />
      ))}
    </div>
  )
}

export default function SetupPage() {
  const router = useRouter()
  const [step,    setStep]    = useState(0)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState({
    name: '', weight: '', height: '', age: '',
    goal: '', activity: '1.55',
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function next()    { setStep(s => s + 1) }
  function back()    { setStep(s => s - 1) }

  async function handleFinish() {
    setLoading(true)
    setError('')
    try {
      const res = await completeSetup({
        name:     form.name.trim() || 'User',
        weight:   Number(form.weight) || 70,
        height:   Number(form.height) || 170,
        age:      Number(form.age)    || 20,
        goal:     form.goal || 'gain',
        activity: form.activity,
      })
      localStorage.setItem('ob_user', JSON.stringify(res.data.user))
      router.push('/')
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const canNext = [
    true,
    !!form.name.trim() && !!form.age && !!form.height && !!form.weight,
    !!form.goal,
    true,
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto w-full px-6 py-8 flex flex-col flex-1">

        {step > 0 && step < 4 && (
          <button onClick={back} className="flex items-center gap-1.5 mb-4 w-fit" style={{ color: '#7A7A9A' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span style={{ fontSize: 13 }}>Back</span>
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center">

          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <div className="animate-stagger-1 text-center">
              <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
                style={{ background: 'rgba(123,111,232,0.12)', border: '1px solid rgba(123,111,232,0.25)' }}>
                🏔️
              </div>
              <h1 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 28 }}>
                Welcome to Obsidian Lens
              </h1>
              <p style={{ color: '#7A7A9A', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
                Let's set up your profile so we can calculate your calories, protein, water goals, and exercise weights — all personalised for you.
              </p>
              <p style={{ color: '#4A4A6A', fontSize: 13, marginBottom: 24 }}>
                This takes about 1 minute
              </p>
              <button onClick={next}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple" style={{ fontSize: 16 }}>
                Let's Go →
              </button>
            </div>
          )}

          {/* ── STEP 1: Personal details ── */}
          {step === 1 && (
            <div className="animate-stagger-1">
              <StepDots current={1} />
              <h2 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 24 }}>
                About you
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                Used to calculate your daily targets — calories, protein, and water.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <div>
                  <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Your name
                  </label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    placeholder="e.g. Aarchi" autoFocus
                    className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                    style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A', fontSize: 16 }} />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'age',    label: 'Age',    unit: 'yrs', placeholder: '20' },
                    { key: 'height', label: 'Height', unit: 'cm',  placeholder: '170' },
                    { key: 'weight', label: 'Weight', unit: 'kg',  placeholder: '65' },
                  ].map(f => (
                    <div key={f.key}>
                      <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        {f.label}
                      </label>
                      <div className="flex items-center mt-1.5 rounded-xl overflow-hidden"
                        style={{ border: '1px solid #2A2A4A', background: '#13132A' }}>
                        <input type="number" value={form[f.key]}
                          onChange={e => set(f.key, e.target.value)}
                          placeholder={f.placeholder}
                          className="flex-1 px-2 py-3 outline-none text-sm w-0 min-w-0"
                          style={{ background: 'transparent', color: '#E2E2F0', fontSize: 15 }} />
                        <span className="px-1.5 text-xs flex-shrink-0" style={{ color: '#4A4A6A' }}>{f.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={next} disabled={!canNext[1]}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple disabled:opacity-30" style={{ fontSize: 16 }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 2: Goal ── */}
          {step === 2 && (
            <div className="animate-stagger-1">
              <StepDots current={2} />
              <h2 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 24 }}>
                What's your goal?
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Sets your calorie target and macro ratios.
              </p>
              <div className="flex flex-col gap-2.5 mb-6">
                {GOALS.map(g => (
                  <button key={g.value} onClick={() => set('goal', g.value)}
                    className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all active:scale-95"
                    style={{
                      background: form.goal === g.value ? 'rgba(123,111,232,0.12)' : '#13132A',
                      border: `1.5px solid ${form.goal === g.value ? '#7B6FE8' : '#2A2A4A'}`,
                    }}>
                    <span style={{ fontSize: 26 }}>{g.icon}</span>
                    <div>
                      <p style={{ color: '#E2E2F0', fontSize: 15, fontWeight: 700 }}>{g.label}</p>
                      <p style={{ color: '#7A7A9A', fontSize: 12, marginTop: 2 }}>{g.desc}</p>
                    </div>
                    {form.goal === g.value && (
                      <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ background: '#7B6FE8', flexShrink: 0 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <button onClick={next} disabled={!canNext[2]}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple disabled:opacity-30" style={{ fontSize: 16 }}>
                Continue →
              </button>
            </div>
          )}

          {/* ── STEP 3: Activity level ── */}
          {step === 3 && (
            <div className="animate-stagger-1">
              <StepDots current={3} />
              <h2 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 24 }}>
                Activity level
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                How active are you outside of workouts?
              </p>
              <div className="flex flex-col gap-2.5 mb-6">
                {ACTIVITIES.map(a => (
                  <button key={a.value} onClick={() => set('activity', a.value)}
                    className="flex items-center justify-between p-4 rounded-2xl text-left transition-all active:scale-95"
                    style={{
                      background: form.activity === a.value ? 'rgba(123,111,232,0.12)' : '#13132A',
                      border: `1.5px solid ${form.activity === a.value ? '#7B6FE8' : '#2A2A4A'}`,
                    }}>
                    <div>
                      <p style={{ color: '#E2E2F0', fontSize: 15, fontWeight: 700 }}>{a.label}</p>
                      <p style={{ color: '#7A7A9A', fontSize: 12, marginTop: 2 }}>{a.desc}</p>
                    </div>
                    {form.activity === a.value && (
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: '#7B6FE8' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Calculated preview */}
              {form.weight && form.height && form.age && (
                <div className="rounded-2xl p-4 mb-5"
                  style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.2)' }}>
                  <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                    Your estimated targets
                  </p>
                  {(() => {
                    const w = Number(form.weight), h = Number(form.height), a = Number(form.age)
                    const bmr  = 88.36 + 13.4 * w + 4.8 * h - 5.7 * a
                    const tdee = Math.round(bmr * Number(form.activity))
                    const cal  = form.goal === 'gain' ? tdee + 300 : form.goal === 'cut' ? tdee - 400 : tdee
                    return [
                      { label: 'Daily calories', val: `${cal} kcal` },
                      { label: 'Protein',        val: `${Math.round(w * 2)} g/day` },
                      { label: 'Water goal',     val: `${(w * 0.035 + 0.5).toFixed(1)} L/day` },
                    ].map((r, i, arr) => (
                      <div key={r.label} className="flex justify-between py-2"
                        style={{ borderBottom: i < arr.length - 1 ? '1px solid #1A1A35' : 'none' }}>
                        <span style={{ color: '#7A7A9A', fontSize: 13 }}>{r.label}</span>
                        <span style={{ color: '#9B8FF8', fontSize: 13, fontWeight: 700 }}>{r.val}</span>
                      </div>
                    ))
                  })()}
                </div>
              )}

              {error && (
                <div className="px-4 py-3 rounded-xl mb-3 text-sm"
                  style={{ background: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)' }}>
                  {error}
                </div>
              )}

              <button onClick={handleFinish} disabled={loading}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontSize: 16 }}>
                {loading
                  ? <div className="w-5 h-5 rounded-full border-2 animate-spin"
                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  : 'Enter the Vault →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
