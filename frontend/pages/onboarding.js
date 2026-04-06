import { useState } from 'react'
import { useRouter } from 'next/router'
import { updateUser, logWeight } from '../lib/api'
import { useToast } from '../components/Toast'
import { useNotifications } from '../lib/useNotifications'

const STEPS = ['welcome', 'profile', 'goal', 'notifications', 'done']

const SPLIT_PREVIEW = [
  { day: 'Mon', muscle: 'Chest', icon: '🏋️' },
  { day: 'Tue', muscle: 'Back', icon: '🔙' },
  { day: 'Wed', muscle: 'Shoulder', icon: '💪' },
  { day: 'Thu', muscle: 'Arms', icon: '💪' },
  { day: 'Fri', muscle: 'Legs', icon: '🦵' },
  { day: 'Sat', muscle: 'Core', icon: '🔥' },
  { day: 'Sun', muscle: 'Rest', icon: '😴' },
]

function StepDots({ current, total }) {
  return (
    <div className="flex gap-1.5 justify-center mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-300"
          style={{
            width: i === current ? 20 : 6,
            height: 6,
            background: i === current ? '#7B6FE8' : 'rgba(123,111,232,0.25)',
          }}
        />
      ))}
    </div>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const { enableReminders, sendTestNotification } = useNotifications()
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [notifEnabled, setNotifEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    weight: '',
    height: '',
    age: '',
    goal: 'gain',
    activity: '1.55',
  })

  function set(k, v) { setForm(p => ({ ...p, [k]: v })) }
  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)) }
  function back() { setStep(s => Math.max(s - 1, 0)) }

  async function handleEnableNotifications() {
    const ok = await enableReminders()
    setNotifEnabled(ok)
    if (ok) {
      setTimeout(() => {
        sendTestNotification('Obsidian Lens 🚀', 'Notifications are working! You\'re all set.')
      }, 500)
    }
  }

  async function handleFinish() {
    setSaving(true)
    try {
      await updateUser({
        name: form.name || 'Aarchi',
        weight: Number(form.weight) || 72,
        height: Number(form.height) || 175,
        age: Number(form.age) || 24,
        goal: form.goal,
      })
      if (form.weight) await logWeight(Number(form.weight))
      localStorage.setItem('ob_onboarded', '1')
      toast(`Welcome, ${form.name || 'Aarchi'}! Your vault is ready.`, 'success', 3000)
    } catch {}
    router.push('/')
  }

  const currentStep = STEPS[step]

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: '#0D0D1A' }}
    >
      <div className="max-w-sm mx-auto w-full px-6 py-8 flex flex-col flex-1">

        {/* Back button */}
        {step > 0 && step < STEPS.length - 1 && (
          <button
            onClick={back}
            className="flex items-center gap-1.5 mb-6 transition-all hover:opacity-70 w-fit"
            style={{ color: '#7A7A9A' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            <span style={{ fontSize: 13 }}>Back</span>
          </button>
        )}

        <div className="flex-1 flex flex-col justify-center">

          {/* ── WELCOME ── */}
          {currentStep === 'welcome' && (
            <div className="animate-stagger-1 text-center">
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
                style={{ background: 'rgba(123,111,232,0.15)', border: '1px solid rgba(123,111,232,0.3)' }}
              >
                🏔️
              </div>
              <h1 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 30 }}>
                Obsidian Lens
              </h1>
              <p style={{ color: '#7A7A9A', fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
                Your personal performance vault. Track workouts, nutrition, hydration and streaks — all in one dark, focused space.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-10 text-left">
                {[
                  { icon: '💪', title: '6-day split', desc: 'Personalised workout plan with weights' },
                  { icon: '💧', title: 'Water reminders', desc: 'Hourly alerts to stay hydrated' },
                  { icon: '🥗', title: 'Macro tracking', desc: 'Log protein, carbs, fats & fiber' },
                  { icon: '⚡', title: 'Streak system', desc: 'Build consistency day by day' },
                ].map(f => (
                  <div
                    key={f.title}
                    className="rounded-2xl p-3"
                    style={{ background: '#13132A', border: '1px solid #2A2A4A' }}
                  >
                    <div className="text-xl mb-1">{f.icon}</div>
                    <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 13 }}>{f.title}</p>
                    <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{f.desc}</p>
                  </div>
                ))}
              </div>

              <button
                onClick={next}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
                style={{ fontSize: 16 }}
              >
                Get Started
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full mt-2 py-3 rounded-xl transition-all hover:opacity-70"
                style={{ color: '#4A4A6A', fontSize: 13 }}
              >
                Skip setup, use defaults
              </button>
            </div>
          )}

          {/* ── PROFILE ── */}
          {currentStep === 'profile' && (
            <div className="animate-stagger-1">
              <StepDots current={1} total={3} />
              <h2 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 26 }}>
                Your profile
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                We'll use this to calculate your targets — calories, protein, water, and workout weights.
              </p>

              <div className="mb-4">
                <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Your name
                </label>
                <input
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder="e.g. Aarchi"
                  autoFocus
                  className="w-full mt-2 px-4 py-3 rounded-xl outline-none text-base"
                  style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A', fontSize: 16 }}
                />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[
                  { key: 'age', label: 'Age', placeholder: '24', unit: 'yrs' },
                  { key: 'height', label: 'Height', placeholder: '175', unit: 'cm' },
                  { key: 'weight', label: 'Weight', placeholder: '72', unit: 'kg' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {f.label}
                    </label>
                    <div
                      className="flex items-center mt-2 rounded-xl overflow-hidden"
                      style={{ border: '1px solid #2A2A4A', background: '#13132A' }}
                    >
                      <input
                        type="number"
                        value={form[f.key]}
                        onChange={e => set(f.key, e.target.value)}
                        placeholder={f.placeholder}
                        className="flex-1 px-3 py-3 outline-none text-sm w-0 min-w-0"
                        style={{ background: 'transparent', color: '#E2E2F0' }}
                      />
                      <span className="px-2 text-xs flex-shrink-0" style={{ color: '#4A4A6A' }}>{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={next}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
                style={{ fontSize: 16 }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── GOAL ── */}
          {currentStep === 'goal' && (
            <div className="animate-stagger-1">
              <StepDots current={2} total={3} />
              <h2 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 26 }}>
                What's your goal?
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
                This sets your calorie target and macro ratios.
              </p>

              <div className="flex flex-col gap-3 mb-6">
                {[
                  { value: 'gain', icon: '💪', title: 'Muscle Gain', desc: 'Build strength and size — +300 kcal surplus, 2g protein/kg' },
                  { value: 'cut', icon: '🔥', title: 'Fat Loss', desc: 'Lean down while keeping muscle — −400 kcal deficit' },
                  { value: 'maintain', icon: '⚖️', title: 'Maintenance', desc: 'Recomp and stay healthy — eat at TDEE' },
                ].map(g => (
                  <button
                    key={g.value}
                    onClick={() => set('goal', g.value)}
                    className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all hover:opacity-90"
                    style={{
                      background: form.goal === g.value ? 'rgba(123,111,232,0.12)' : '#13132A',
                      border: `1.5px solid ${form.goal === g.value ? '#7B6FE8' : '#2A2A4A'}`,
                    }}
                  >
                    <span style={{ fontSize: 28 }}>{g.icon}</span>
                    <div>
                      <p className="font-bold" style={{ color: '#E2E2F0', fontSize: 15, fontFamily: 'Syne, sans-serif' }}>{g.title}</p>
                      <p style={{ color: '#7A7A9A', fontSize: 12, marginTop: 3, lineHeight: 1.5 }}>{g.desc}</p>
                    </div>
                    {form.goal === g.value && (
                      <div className="ml-auto w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#7B6FE8' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Workout split preview */}
              <div className="rounded-2xl p-4 mb-6" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
                <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Your weekly workout split
                </p>
                <div className="grid grid-cols-7 gap-1">
                  {SPLIT_PREVIEW.map(s => (
                    <div key={s.day} className="text-center">
                      <div
                        className="rounded-lg py-2 mb-1"
                        style={{ background: s.muscle === 'Rest' ? '#0D0D1A' : 'rgba(123,111,232,0.1)' }}
                      >
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                      </div>
                      <p style={{ color: '#4A4A6A', fontSize: 8, fontWeight: 600 }}>{s.day}</p>
                      <p style={{ color: '#7A7A9A', fontSize: 7, marginTop: 1 }}>{s.muscle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={next}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
                style={{ fontSize: 16 }}
              >
                Continue
              </button>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {currentStep === 'notifications' && (
            <div className="animate-stagger-1 text-center">
              <StepDots current={3} total={3} />
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-3xl"
                style={{ background: notifEnabled ? 'rgba(29,158,117,0.15)' : 'rgba(123,111,232,0.15)', border: `1px solid ${notifEnabled ? 'rgba(29,158,117,0.3)' : 'rgba(123,111,232,0.3)'}` }}
              >
                {notifEnabled ? '✅' : '🔔'}
              </div>
              <h2 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 26 }}>
                {notifEnabled ? 'Notifications enabled!' : 'Stay on track'}
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
                {notifEnabled
                  ? 'You\'ll get hourly water reminders and a gym day alert every morning at 7 AM.'
                  : 'Enable notifications to get hourly water reminders, daily workout alerts, and streak nudges on your phone.'}
              </p>

              <div className="flex flex-col gap-2 mb-8 text-left">
                {[
                  { icon: '💧', title: 'Hourly water reminders', time: '7 AM – 10 PM' },
                  { icon: '💪', title: 'Gym day alert', time: 'Every morning at 7 AM' },
                  { icon: '⚡', title: 'Streak motivator', time: 'When you\'re close to breaking it' },
                  { icon: '🥗', title: 'Meal reminders', time: 'Breakfast, lunch & dinner' },
                ].map(n => (
                  <div
                    key={n.title}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: '#13132A', border: '1px solid #2A2A4A' }}
                  >
                    <span style={{ fontSize: 18 }}>{n.icon}</span>
                    <div>
                      <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 500 }}>{n.title}</p>
                      <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>{n.time}</p>
                    </div>
                    {notifEnabled && (
                      <div className="ml-auto w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#1D9E75' }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!notifEnabled ? (
                <>
                  <button
                    onClick={handleEnableNotifications}
                    className="w-full py-4 rounded-2xl font-bold text-white btn-purple mb-2"
                    style={{ fontSize: 16 }}
                  >
                    Enable Notifications
                  </button>
                  <button
                    onClick={next}
                    className="w-full py-3 rounded-xl transition-all hover:opacity-70"
                    style={{ color: '#4A4A6A', fontSize: 14 }}
                  >
                    Maybe later
                  </button>
                </>
              ) : (
                <button
                  onClick={next}
                  className="w-full py-4 rounded-2xl font-bold text-white btn-purple"
                  style={{ fontSize: 16 }}
                >
                  Continue
                </button>
              )}
            </div>
          )}

          {/* ── DONE ── */}
          {currentStep === 'done' && (
            <div className="animate-stagger-1 text-center">
              <div
                className="w-24 h-24 rounded-3xl mx-auto mb-6 flex items-center justify-center text-5xl"
                style={{ background: 'rgba(123,111,232,0.12)', border: '1px solid rgba(123,111,232,0.3)' }}
              >
                🏆
              </div>
              <h2 className="font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 28 }}>
                You're all set, {form.name || 'Aarchi'}!
              </h2>
              <p style={{ color: '#7A7A9A', fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
                Your vault is configured. Start your first session today and begin building your streak.
              </p>

              <div
                className="rounded-2xl p-4 mb-8 text-left"
                style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}
              >
                <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Your daily targets
                </p>
                {(() => {
                  const w = Number(form.weight) || 72
                  const h = Number(form.height) || 175
                  const a = Number(form.age) || 24
                  const bmr = 88.36 + 13.4 * w + 4.8 * h - 5.7 * a
                  const tdee = Math.round(bmr * 1.55)
                  const cal = form.goal === 'gain' ? tdee + 300 : form.goal === 'cut' ? tdee - 400 : tdee
                  return [
                    { label: 'Daily calories', val: `${cal} kcal`, color: '#EF9F27' },
                    { label: 'Protein target', val: `${Math.round(w * 2)} g`, color: '#7B6FE8' },
                    { label: 'Water goal', val: `${(w * 0.035 + 0.5).toFixed(1)} L`, color: '#378ADD' },
                  ].map(r => (
                    <div key={r.label} className="flex justify-between items-center py-2.5" style={{ borderBottom: '1px solid #1A1A35' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                        <span style={{ color: '#7A7A9A', fontSize: 13 }}>{r.label}</span>
                      </div>
                      <span style={{ color: '#E2E2F0', fontSize: 14, fontWeight: 700, fontFamily: 'Syne, sans-serif' }}>{r.val}</span>
                    </div>
                  ))
                })()}
              </div>

              <button
                onClick={handleFinish}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-bold text-white btn-purple disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ fontSize: 16 }}
              >
                {saving
                  ? <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  : 'Enter the Vault →'}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
