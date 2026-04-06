import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { useNotifications } from '../lib/useNotifications'
import { useToast } from '../components/Toast'

const STORAGE_KEY = 'ob_notif_prefs'

const DEFAULT_PREFS = {
  water:       true,
  waterStart:  '07:00',
  waterEnd:    '22:00',
  gymDay:      true,
  gymTime:     '07:00',
  missedDay:   true,
  meals:       true,
  mealTimes:   { breakfast: '08:00', lunch: '13:00', dinner: '19:00' },
  postWorkout: false,
  bedtime:     false,
  bedtimeTime: '22:00',
  streak:      true,
}

function Toggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="flex-shrink-0 transition-all"
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: on ? '#7B6FE8' : '#2A2A4A',
        position: 'relative',
        border: 'none',
      }}
    >
      <div style={{
        position: 'absolute',
        width: 16, height: 16, borderRadius: '50%',
        background: '#fff',
        top: 3,
        left: on ? 21 : 3,
        transition: 'left 0.2s',
      }} />
    </button>
  )
}

function TimeInput({ value, onChange, disabled }) {
  return (
    <input
      type="time"
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="px-2 py-1 rounded-lg outline-none text-xs"
      style={{
        background: disabled ? '#1A1A35' : '#2A2A4A',
        color: disabled ? '#4A4A6A' : '#E2E2F0',
        border: '1px solid #2A2A4A',
        opacity: disabled ? 0.5 : 1,
      }}
    />
  )
}

function Row({ icon, title, sub, on, onChange, children }) {
  return (
    <div style={{ borderBottom: '1px solid #1A1A35', paddingBottom: 12, marginBottom: 12 }}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0"
          style={{ background: 'rgba(123,111,232,0.08)', fontSize: 16 }}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm" style={{ color: '#E2E2F0' }}>{title}</p>
          {sub && <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>{sub}</p>}
        </div>
        <Toggle on={on} onChange={onChange} />
      </div>
      {on && children && <div className="mt-3 pl-12">{children}</div>}
    </div>
  )
}

export default function NotificationsPage() {
  const router = useRouter()
  const { enableReminders, requestPermission, sendTestNotification } = useNotifications()
  const toast = useToast()
  const [prefs, setPrefs] = useState(DEFAULT_PREFS)
  const [permission, setPermission] = useState('default')
  const [enabling, setEnabling] = useState(false)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    // Load saved prefs
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setPrefs(p => ({ ...p, ...JSON.parse(saved) }))
    } catch {}
    // Check permission
    if ('Notification' in window) setPermission(Notification.permission)
  }, [])

  function setPref(k, v) {
    setPrefs(p => {
      const next = { ...p, [k]: v }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function setMealTime(meal, val) {
    const next = { ...prefs.mealTimes, [meal]: val }
    setPref('mealTimes', next)
  }

  async function handleEnable() {
    setEnabling(true)
    const ok = await enableReminders()
    setPermission(ok ? 'granted' : 'denied')
    setEnabling(false)
  }

  function handleTest() {
    sendTestNotification('Obsidian Lens 🔔', 'Test notification — everything is working!')
    setTestSent(true)
    setTimeout(() => setTestSent(false), 3000)
  }

  const isDenied = permission === 'denied'
  const isGranted = permission === 'granted'

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 animate-stagger-1">
          <button onClick={() => router.push('/settings')} style={{ color: '#7A7A9A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Settings</p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Notifications</h1>
          </div>
        </div>

        {/* Permission banner */}
        {!isGranted && (
          <div
            className="rounded-2xl p-4 mb-4 animate-stagger-2"
            style={{
              background: isDenied ? 'rgba(226,75,74,0.07)' : 'rgba(123,111,232,0.07)',
              border: `1px solid ${isDenied ? 'rgba(226,75,74,0.2)' : 'rgba(123,111,232,0.2)'}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl flex-shrink-0">{isDenied ? '🚫' : '🔔'}</div>
              <div className="flex-1">
                <p className="font-semibold text-sm" style={{ color: '#E2E2F0', marginBottom: 4 }}>
                  {isDenied ? 'Notifications blocked' : 'Notifications not enabled'}
                </p>
                <p style={{ color: '#7A7A9A', fontSize: 12, lineHeight: 1.6 }}>
                  {isDenied
                    ? 'You\'ve blocked notifications for this site. Go to your browser settings → Site permissions to re-enable.'
                    : 'Enable notifications to get water reminders, gym alerts, and streak nudges on your phone.'}
                </p>
                {!isDenied && (
                  <button
                    onClick={handleEnable}
                    disabled={enabling}
                    className="mt-3 px-4 py-2 rounded-xl font-bold text-white btn-purple text-sm disabled:opacity-50"
                  >
                    {enabling ? 'Requesting...' : 'Enable Notifications'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* All on / test row */}
        {isGranted && (
          <div className="flex gap-2 mb-4 animate-stagger-2">
            <div
              className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.2)' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span style={{ color: '#1D9E75', fontSize: 12, fontWeight: 600 }}>Notifications active</span>
            </div>
            <button
              onClick={handleTest}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{
                background: testSent ? 'rgba(29,158,117,0.12)' : 'rgba(123,111,232,0.1)',
                color: testSent ? '#1D9E75' : '#9B8FF8',
                border: `1px solid ${testSent ? 'rgba(29,158,117,0.25)' : 'rgba(123,111,232,0.2)'}`,
              }}
            >
              {testSent ? '✓ Sent!' : 'Test'}
            </button>
          </div>
        )}

        {/* Notification settings */}
        <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>

          <Row icon="💧" title="Water reminders" sub="Remind you to drink water regularly"
            on={prefs.water} onChange={v => setPref('water', v)}>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span style={{ color: '#7A7A9A', fontSize: 11 }}>From</span>
                <TimeInput value={prefs.waterStart} onChange={v => setPref('waterStart', v)} />
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#7A7A9A', fontSize: 11 }}>To</span>
                <TimeInput value={prefs.waterEnd} onChange={v => setPref('waterEnd', v)} />
              </div>
            </div>
            <p style={{ color: '#4A4A6A', fontSize: 10, marginTop: 6 }}>Reminder fires every hour in this window</p>
          </Row>

          <Row icon="💪" title="Gym day alert" sub="Morning notification with today's muscle group"
            on={prefs.gymDay} onChange={v => setPref('gymDay', v)}>
            <div className="flex items-center gap-2">
              <span style={{ color: '#7A7A9A', fontSize: 11 }}>Alert time</span>
              <TimeInput value={prefs.gymTime} onChange={v => setPref('gymTime', v)} />
            </div>
          </Row>

          <Row icon="⚠️" title="Missed day alert" sub="Next-day reminder if you skipped a workout"
            on={prefs.missedDay} onChange={v => setPref('missedDay', v)} />

          <Row icon="🥗" title="Meal reminders" sub="Prompt you to log meals & hit protein targets"
            on={prefs.meals} onChange={v => setPref('meals', v)}>
            <div className="flex flex-col gap-2">
              {[['breakfast', '🌅', 'Breakfast'], ['lunch', '☀️', 'Lunch'], ['dinner', '🌙', 'Dinner']].map(([k, icon, label]) => (
                <div key={k} className="flex items-center justify-between">
                  <span style={{ color: '#7A7A9A', fontSize: 11 }}>{icon} {label}</span>
                  <TimeInput value={prefs.mealTimes[k]} onChange={v => setMealTime(k, v)} />
                </div>
              ))}
            </div>
          </Row>

          <Row icon="🥤" title="Post-workout shake" sub="30-min alert after session ends"
            on={prefs.postWorkout} onChange={v => setPref('postWorkout', v)} />

          <Row icon="⚡" title="Streak motivator" sub="Nudge when your streak is about to reset"
            on={prefs.streak} onChange={v => setPref('streak', v)} />

          <div style={{ borderBottom: 'none', paddingBottom: 0, marginBottom: 0 }}>
            <Row icon="🌙" title="Bedtime reminder" sub="Evening prompt to log the day"
              on={prefs.bedtime} onChange={v => setPref('bedtime', v)}>
              <div className="flex items-center gap-2">
                <span style={{ color: '#7A7A9A', fontSize: 11 }}>Time</span>
                <TimeInput value={prefs.bedtimeTime} onChange={v => setPref('bedtimeTime', v)} />
              </div>
            </Row>
          </div>
        </div>

        {/* Install PWA section */}
        <div className="rounded-2xl p-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <h3 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>
            Install on your phone
          </h3>
          <p style={{ color: '#7A7A9A', fontSize: 12, lineHeight: 1.7, marginBottom: 12 }}>
            For the most reliable notifications, install Obsidian Lens as an app on your home screen.
          </p>
          <div className="flex flex-col gap-2">
            {[
              { icon: '🤖', label: 'Android (Chrome)', steps: 'Tap ⋮ → "Add to Home Screen"' },
              { icon: '🍎', label: 'iPhone (Safari)', steps: 'Tap Share → "Add to Home Screen"' },
            ].map(p => (
              <div key={p.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: '#1A1A35' }}>
                <span style={{ fontSize: 20 }}>{p.icon}</span>
                <div>
                  <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 500 }}>{p.label}</p>
                  <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>{p.steps}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
