import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { logStudy, getStudyToday, getStudyWeek } from '../lib/api'
import { useToast } from '../components/Toast'

const WORK_SECS  = 25 * 60
const BREAK_SECS = 5  * 60
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Coding', 'History', 'Other']
const DAY_ABR  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function pad(n) { return String(n).padStart(2, '0') }
function fmtTimer(s) { return `${pad(Math.floor(s / 60))}:${pad(s % 60)}` }
function fmtHours(s) { return s >= 3600 ? (s / 3600).toFixed(1) + 'h' : Math.round(s / 60) + 'm' }

export default function StudyPage() {
  const router = useRouter()
  const toast  = useToast()

  /* ── Timer state ─────────────────────────── */
  const [mode,     setMode]     = useState('pomodoro')   // 'pomodoro' | 'stopwatch'
  const [running,  setRunning]  = useState(false)
  const [isBreak,  setIsBreak]  = useState(false)
  const [pomSecs,  setPomSecs]  = useState(WORK_SECS)
  const [swSecs,   setSwSecs]   = useState(0)
  const [pomsDone, setPomsDone] = useState(0)
  const timerRef = useRef(null)

  /* ── Session metadata ─────────────────────── */
  const [subject, setSubject] = useState('Mathematics')
  const [note,    setNote]    = useState('')

  /* ── Remote data ──────────────────────────── */
  const [todayData, setTodayData] = useState({ logs: [], total_seconds: 0 })
  const [weekData,  setWeekData]  = useState([])
  const [saving,    setSaving]    = useState(false)
  const [flash,     setFlash]     = useState(null) // 'saved' | 'error'

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [t, w] = await Promise.allSettled([getStudyToday(), getStudyWeek()])
    if (t.status === 'fulfilled') setTodayData(t.value.data)
    if (w.status === 'fulfilled') setWeekData(w.value.data)
  }

  /* ── Timer tick ───────────────────────────── */
  useEffect(() => {
    if (running) {
      timerRef.current = setInterval(() => {
        if (mode === 'pomodoro') {
          setPomSecs(t => {
            if (t <= 1) {
              clearInterval(timerRef.current)
              setRunning(false)
              if (!isBreak) {
                persistSession(WORK_SECS)
                setPomsDone(c => c + 1)
                setIsBreak(true)
                setTimeout(() => setPomSecs(BREAK_SECS), 0)
              } else {
                setIsBreak(false)
                setTimeout(() => setPomSecs(WORK_SECS), 0)
              }
              return 0
            }
            return t - 1
          })
        } else {
          setSwSecs(t => t + 1)
        }
      }, 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [running, mode, isBreak])

  /* ── Persist a session to backend ────────── */
  async function persistSession(seconds) {
    if (seconds < 60) return
    setSaving(true)
    try {
      await logStudy({ subject, note, seconds, mode })
      await loadData()
      toast(`${subject} session saved! +${Math.round(seconds/60)}m`, 'success', 2500)
      setFlash('saved')
    } catch {
      toast('Saved locally', 'info', 2000)
      setFlash('error')
    } finally {
      setSaving(false)
      setTimeout(() => setFlash(null), 2500)
    }
  }

  function handleStopwatch() {
    if (running) {
      setRunning(false)
      if (swSecs >= 60) persistSession(swSecs)
      setSwSecs(0)
    } else {
      setRunning(true)
    }
  }

  function handleReset() {
    setRunning(false)
    setIsBreak(false)
    setPomSecs(WORK_SECS)
    setSwSecs(0)
  }

  function switchMode(m) {
    handleReset()
    setMode(m)
  }

  /* ── Derived ──────────────────────────────── */
  const displaySecs = mode === 'pomodoro' ? pomSecs : swSecs
  const totalSecs   = mode === 'pomodoro' ? (isBreak ? BREAK_SECS : WORK_SECS) : 3600
  const pct         = mode === 'pomodoro'
    ? 1 - pomSecs / (isBreak ? BREAK_SECS : WORK_SECS)
    : Math.min(swSecs / 3600, 1)

  const R    = 58
  const circ = 2 * Math.PI * R
  const offset = circ * (1 - pct)
  const accentColor = isBreak ? '#1D9E75' : '#7B6FE8'

  const todayTotal  = todayData.total_seconds || 0
  const goalSecs    = 6 * 3600
  const goalPct     = Math.min(todayTotal / goalSecs, 1)

  // build 7-day bar chart from weekData
  const today = new Date()
  const week7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today); d.setDate(today.getDate() - (6 - i))
    const dateStr = d.toISOString().split('T')[0]
    const matched = weekData.filter(w => w.date === dateStr)
    const secs = matched.reduce((a, w) => a + (w.seconds || 0), 0)
    return { date: dateStr, secs, day: DAY_ABR[d.getDay() === 0 ? 6 : d.getDay() - 1] }
  })
  const maxSecs = Math.max(...week7.map(w => w.secs), 3600)

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 animate-stagger-1">
          <button onClick={() => router.push('/')} style={{ color: '#7A7A9A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Focus tracker</p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Study Hours</h1>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4 animate-stagger-1">
          {[
            { label: 'Today', val: fmtHours(todayTotal), sub: `${todayData.logs?.length || 0} sessions` },
            { label: 'Goal', val: fmtHours(goalSecs), sub: `${Math.round(goalPct * 100)}% done` },
            { label: 'Pomodoros', val: pomsDone, sub: 'this session' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p className="font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 18 }}>{s.val}</p>
              <p style={{ color: '#7A7A9A', fontSize: 9, marginTop: 1 }}>{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Today's progress bar */}
        <div className="mb-4 animate-stagger-1">
          <div className="flex justify-between mb-1.5">
            <span style={{ color: '#7A7A9A', fontSize: 11 }}>Today's focus goal</span>
            <span style={{ color: '#E2E2F0', fontSize: 11, fontWeight: 600 }}>{fmtHours(todayTotal)} / 6h</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1A1A35' }}>
            <div className="h-2 rounded-full progress-bar" style={{ width: `${goalPct * 100}%`, background: '#7B6FE8' }} />
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 rounded-xl mb-4 animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          {[{ id: 'pomodoro', label: '🍅  Pomodoro (25m)' }, { id: 'stopwatch', label: '⏱  Stopwatch' }].map(m => (
            <button
              key={m.id}
              onClick={() => switchMode(m.id)}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{ background: mode === m.id ? '#7B6FE8' : 'transparent', color: mode === m.id ? '#fff' : '#7A7A9A' }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Timer card */}
        <div className="rounded-2xl p-5 mb-4 text-center card-glow animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>

          {/* Break / Focus badge */}
          {mode === 'pomodoro' && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-4"
              style={{
                background: isBreak ? 'rgba(29,158,117,0.12)' : 'rgba(123,111,232,0.12)',
                color: isBreak ? '#1D9E75' : '#9B8FF8',
                border: `1px solid ${isBreak ? 'rgba(29,158,117,0.25)' : 'rgba(123,111,232,0.25)'}`,
              }}
            >
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
              {isBreak ? 'Break time — rest up!' : 'Focus time — stay locked in'}
            </div>
          )}

          {/* Ring */}
          <div className="relative inline-flex items-center justify-center mb-5" style={{ width: 152, height: 152 }}>
            <svg width="152" height="152" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="76" cy="76" r={R} fill="none" strokeWidth="9"
                stroke="rgba(123,111,232,0.08)" />
              <circle cx="76" cy="76" r={R} fill="none" strokeWidth="9"
                stroke={accentColor}
                strokeDasharray={circ}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.7s ease, stroke 0.4s ease' }}
              />
            </svg>
            <div className="absolute text-center">
              <p
                className={running ? 'timer-active' : ''}
                style={{ fontFamily: 'Syne, sans-serif', fontSize: 34, fontWeight: 700, color: '#E2E2F0', letterSpacing: '-0.02em', lineHeight: 1 }}
              >
                {fmtTimer(displaySecs)}
              </p>
              <p style={{ color: '#4A4A6A', fontSize: 9, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {mode === 'pomodoro' ? (isBreak ? 'break' : 'focus') : 'elapsed'}
              </p>
            </div>
          </div>

          {/* Pomodoro dots */}
          {mode === 'pomodoro' && (
            <div className="flex gap-2 justify-center mb-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: i < pomsDone % 4 ? '#7B6FE8' : 'rgba(123,111,232,0.12)' }}
                />
              ))}
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:opacity-70 active:scale-90"
              style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7A7A9A" strokeWidth="2">
                <path d="M1 4v6h6M3.51 15a9 9 0 1 0 .49-4" />
              </svg>
            </button>

            {mode === 'pomodoro' ? (
              <button
                onClick={() => setRunning(v => !v)}
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: running ? '#E24B4A' : accentColor, boxShadow: `0 4px 20px ${accentColor}55` }}
              >
                {running
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>}
              </button>
            ) : (
              <button
                onClick={handleStopwatch}
                className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                style={{ background: running ? '#E24B4A' : '#7B6FE8', boxShadow: `0 4px 20px ${running ? '#E24B4A55' : '#7B6FE855'}` }}
              >
                {running
                  ? <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  : <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>}
              </button>
            )}

            <button
              onClick={() => { if (mode === 'stopwatch' && swSecs >= 60) persistSession(swSecs) }}
              disabled={mode !== 'stopwatch' || swSecs < 60 || running}
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-30"
              style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </button>
          </div>

          {/* Save flash */}
          {flash && (
            <div className="mt-4 py-2 px-4 rounded-xl text-sm font-semibold animate-stagger-1"
              style={{
                background: flash === 'saved' ? 'rgba(29,158,117,0.1)' : 'rgba(226,75,74,0.1)',
                color: flash === 'saved' ? '#1D9E75' : '#E24B4A',
                border: `1px solid ${flash === 'saved' ? 'rgba(29,158,117,0.2)' : 'rgba(226,75,74,0.2)'}`,
              }}>
              {flash === 'saved' ? '✓ Session saved!' : '⚠ Saved locally'}
            </div>
          )}
        </div>

        {/* Subject + note */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Subject</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {SUBJECTS.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                style={{
                  background: subject === s ? 'rgba(123,111,232,0.15)' : '#1A1A35',
                  color:      subject === s ? '#9B8FF8' : '#7A7A9A',
                  border: `1px solid ${subject === s ? '#7B6FE8' : '#2A2A4A'}`,
                }}
              >
                {s}
              </button>
            ))}
          </div>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Optional note  (e.g. Chapter 5 · Calculus)"
            className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
            style={{ background: '#1A1A35', color: '#E2E2F0', border: '1px solid #2A2A4A' }}
          />
        </div>

        {/* Weekly bar chart */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-5" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>This week</p>
              <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>
                {fmtHours(week7.reduce((a, d) => a + d.secs, 0))} total
              </p>
            </div>
            <div className="text-right">
              <p style={{ color: '#7B6FE8', fontSize: 12, fontWeight: 600 }}>
                {week7.filter(d => d.secs > 0).length} active days
              </p>
            </div>
          </div>
          <div className="flex items-end gap-1.5" style={{ height: 72 }}>
            {week7.map((d, i) => {
              const h = d.secs > 0 ? Math.max((d.secs / maxSecs) * 60, 6) : 4
              const isToday = i === 6
              return (
                <div key={d.day} className="flex flex-col items-center flex-1 gap-1">
                  <div
                    className="w-full rounded-md transition-all duration-500"
                    style={{
                      height: h,
                      background: isToday ? '#7B6FE8' : d.secs > 0 ? 'rgba(123,111,232,0.4)' : '#1A1A35',
                    }}
                  />
                  <span style={{ color: isToday ? '#9B8FF8' : '#4A4A6A', fontSize: 9, fontWeight: isToday ? 600 : 400 }}>{d.day}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Today's session log */}
        {(todayData.logs?.length || 0) > 0 && (
          <div className="animate-stagger-5">
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Today's sessions
            </p>
            {(todayData.logs || []).map(l => (
              <div
                key={l.id}
                className="flex items-center gap-3 p-3 rounded-xl mb-2"
                style={{ background: '#13132A', border: '1px solid #2A2A4A' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(123,111,232,0.1)', fontSize: 16 }}
                >
                  📚
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm" style={{ color: '#E2E2F0' }}>{l.subject}</p>
                  {l.note && <p className="truncate" style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>{l.note}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm" style={{ color: '#9B8FF8' }}>{fmtHours(l.seconds)}</p>
                  <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase' }}>{l.mode}</p>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
