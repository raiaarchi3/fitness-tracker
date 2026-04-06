import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import StreakBadge from '../components/StreakBadge'
import RingProgress from '../components/RingProgress'
import { useToast } from '../components/Toast'
import { getToday, logWater, startSession, getWeightHistory, getStudyToday } from '../lib/api'

const DAY_ABBR = ['MON','TUE','WED','THU','FRI','SAT','SUN']

const FALLBACK = {
  day_name: 'Wednesday',
  muscle_group: 'Chest',
  user: { name: 'Aarchi', streak: 0, weight: 72, goal: 'gain' },
  water_ml: 600,
  water_goal_ml: 3500,
  protein: 120,
  calories: 1842,
  carbs: 210,
  fats: 38,
  session_id: null,
  session_completed: false,
}

/* ── Weight bar chart ───────────────────────────────────── */
function WeightBars({ history }) {
  const mock = [62, 62.8, 63.5, 65.2, 64.1, 64.8, 63.3]
  const weights = history?.length >= 2
    ? history.slice(0, 7).map(w => w.weight).reverse()
    : mock
  const min = Math.min(...weights) - 0.5
  const max = Math.max(...weights) + 0.5
  const range = max - min || 1
  const peak = Math.max(...weights)

  return (
    <div className="flex items-end gap-1.5" style={{ height: 64 }}>
      {DAY_ABBR.slice(0, weights.length).map((d, i) => {
        const h = Math.max(((weights[i] - min) / range) * 54, 5)
        const isLast = i === weights.length - 1
        const isPeak = weights[i] === peak
        return (
          <div key={d} className="flex flex-col items-center flex-1 gap-1">
            <div className="w-full rounded-sm" style={{
              height: h,
              background: isLast ? '#7B6FE8' : isPeak ? 'rgba(123,111,232,0.55)' : 'rgba(123,111,232,0.18)',
              transition: 'height 0.5s ease',
            }} />
            <span style={{ color: isLast ? '#9B8FF8' : '#4A4A6A', fontSize: 9, fontWeight: isLast ? 600 : 400 }}>{d}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Water segmented bar ────────────────────────────────── */
function WaterSegments({ ml, goal }) {
  const segments = 10
  const filled = Math.round((ml / goal) * segments)
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} className="flex-1 rounded-full" style={{
          height: 4,
          background: i < filled ? '#7B6FE8' : '#2A2A4A',
          transition: 'background 0.3s',
        }} />
      ))}
    </div>
  )
}

/* ── Clickable card wrapper ─────────────────────────────── */
function ClickCard({ onClick, children, className = '', style = {} }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl card-glow cursor-pointer transition-all active:scale-95 hover:opacity-90 ${className}`}
      style={{ background: '#13132A', border: '1px solid #2A2A4A', ...style }}
    >
      {children}
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  const toast  = useToast()

  const [data,          setData]          = useState(null)
  const [weightHistory, setWeightHistory] = useState([])
  const [studyToday,    setStudyToday]    = useState({ total_seconds: 0 })
  const [loading,       setLoading]       = useState(true)
  const [waterAdding,   setWaterAdding]   = useState(false)
  const [sessionBusy,   setSessionBusy]   = useState(false)

  const load = useCallback(async () => {
    try {
      const [todayRes, weightRes, studyRes] = await Promise.allSettled([
        getToday(),
        getWeightHistory(),
        getStudyToday(),
      ])
      setData(todayRes.status === 'fulfilled' ? todayRes.value.data : FALLBACK)
      if (weightRes.status === 'fulfilled') setWeightHistory(weightRes.value.data)
      if (studyRes.status  === 'fulfilled') setStudyToday(studyRes.value.data)
    } catch {
      setData(FALLBACK)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  /* ── Water helpers ──── */
  async function addWater(ml) {
    setWaterAdding(true)
    try {
      const res = await logWater(ml)
      setData(prev => ({ ...prev, water_ml: res.data.amount_ml }))
      toast(`+${ml}ml logged!`, 'info', 1800)
    } catch {
      setData(prev => ({ ...prev, water_ml: Math.min((prev?.water_ml || 0) + ml, 5000) }))
      toast(`+${ml}ml added`, 'info', 1800)
    } finally {
      setWaterAdding(false)
    }
  }

  /* ── Start session ─── */
  async function handleStart() {
    if (!data) return
    setSessionBusy(true)
    try {
      const res = await startSession(data.muscle_group)
      router.push(`/session/${res.data.session.id}`)
    } catch {
      router.push(`/session/new?muscle=${data?.muscle_group || 'Chest'}`)
    } finally {
      setSessionBusy(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="text-center">
        <div className="w-10 h-10 rounded-2xl mx-auto mb-4 flex items-center justify-center"
          style={{ background: 'rgba(123,111,232,0.12)' }}>
          <div className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }} />
        </div>
        <p style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Loading vault...
        </p>
      </div>
    </div>
  )

  const d           = data || FALLBACK
  const user        = d.user || {}
  const waterMl     = d.water_ml || 0
  const waterGoal   = d.water_goal_ml || 3500
  const waterPct    = Math.min(waterMl / waterGoal, 1)
  const proteinGoal = Math.round((user.weight || 72) * 2)
  const calGoal     = user.goal === 'cut' ? 1800 : user.goal === 'maintain' ? 2000 : 2200
  const studySecs   = studyToday?.total_seconds || 0
  const studyGoal   = 6 * 3600
  const studyH      = (studySecs / 3600).toFixed(1)
  const studyPct    = Math.min(studySecs / studyGoal, 1)
  const weightDelta = weightHistory.length >= 2
    ? ((weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight) >= 0 ? '+' : '') +
      (weightHistory[0].weight - weightHistory[weightHistory.length - 1].weight).toFixed(1) + 'kg'
    : '+1.2kg'

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-6 pb-28">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-5 animate-stagger-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/settings')}
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base transition-all hover:opacity-80"
              style={{ background: 'rgba(123,111,232,0.18)', color: '#9B8FF8', fontFamily: 'Syne, sans-serif' }}
            >
              {(user.name || 'A')[0].toUpperCase()}
            </button>
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Performance Overview
              </p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                Hello, {user.name || 'Aarchi'}
              </h1>
            </div>
          </div>
          <button onClick={() => router.push('/notifications')}>
            <StreakBadge streak={user.streak || 0} />
          </button>
        </div>

        {/* ── Workout card ── */}
        <ClickCard
          onClick={handleStart}
          className="p-4 mb-3 animate-stagger-2"
        >
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Upcoming Session
          </p>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', lineHeight: 1.2 }}>
                Today's Workout:
              </h2>
              <h2 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#9B8FF8' }}>
                {d.muscle_group || 'Chest'} Day
              </h2>
              {d.session_completed && (
                <div className="flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-lg w-fit"
                  style={{ background: 'rgba(29,158,117,0.1)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <span style={{ color: '#1D9E75', fontSize: 10, fontWeight: 600 }}>Completed today</span>
                </div>
              )}
            </div>
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(123,111,232,0.1)' }}>
              💪
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); handleStart() }}
            disabled={sessionBusy}
            className="w-full py-3.5 rounded-xl font-bold text-white btn-purple flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ fontSize: 15 }}
          >
            {sessionBusy
              ? <div className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : <>{d.session_completed ? 'View Session' : 'Start Session'}
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </>
            }
          </button>
        </ClickCard>

        {/* ── Water + Protein ── */}
        <div className="grid grid-cols-2 gap-3 mb-3 animate-stagger-3">

          {/* Water */}
          <ClickCard onClick={() => router.push('/nutrition')} className="p-3.5">
            <div className="flex items-center gap-1.5 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#7B6FE8">
                <path d="M12 2C6 10 4 14 4 17a8 8 0 0016 0c0-3-2-7-8-15z" />
              </svg>
              <span style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Water</span>
            </div>
            <div className="font-bold leading-none mb-0.5" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 22 }}>
              {waterMl}
              <span style={{ fontSize: 11, fontWeight: 400, color: '#7A7A9A', marginLeft: 2 }}>ml</span>
            </div>
            <WaterSegments ml={waterMl} goal={waterGoal} />
            <p style={{ color: '#4A4A6A', fontSize: 10, margin: '5px 0 8px' }}>
              Goal: {(waterGoal / 1000).toFixed(1)}L
              {waterPct >= 1 && <span style={{ color: '#1D9E75', marginLeft: 4 }}>✓ Done!</span>}
            </p>
            <div className="flex gap-1.5">
              {[250, 500].map(ml => (
                <button
                  key={ml}
                  onClick={e => { e.stopPropagation(); addWater(ml) }}
                  disabled={waterAdding || waterPct >= 1}
                  className="flex-1 py-1.5 rounded-lg font-semibold disabled:opacity-40 transition-all active:scale-95"
                  style={{ background: 'rgba(123,111,232,0.12)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.2)', fontSize: 10 }}
                >
                  +{ml}ml
                </button>
              ))}
            </div>
          </ClickCard>

          {/* Protein ring */}
          <ClickCard onClick={() => router.push('/nutrition')} className="p-3.5 flex flex-col items-center">
            <div className="w-full flex items-center gap-1.5 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: '#7B6FE8' }} />
              <span style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Protein</span>
            </div>
            <RingProgress
              value={d.protein || 0}
              max={proteinGoal}
              size={84}
              label={`${Math.round(d.protein || 0)}g`}
              sublabel="today"
            />
            <p style={{ color: '#7A7A9A', fontSize: 10, fontWeight: 600, marginTop: 6 }}>
              {Math.round(Math.min((d.protein || 0) / proteinGoal, 1) * 100)}% of goal
            </p>
            <p style={{ color: '#4A4A6A', fontSize: 9, marginTop: 1 }}>Goal: {proteinGoal}g</p>
          </ClickCard>
        </div>

        {/* ── Calories bar ── */}
        <ClickCard onClick={() => router.push('/nutrition')} className="px-4 py-3 mb-3 animate-stagger-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#EF9F27">
                <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
              </svg>
              <span style={{ color: '#7A7A9A', fontSize: 12, fontWeight: 500 }}>Calories</span>
            </div>
            <span style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16, fontWeight: 700 }}>
              {(d.calories || 0).toLocaleString()}
              <span style={{ color: '#7A7A9A', fontSize: 11, fontWeight: 400, marginLeft: 3 }}>/ {calGoal}</span>
            </span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#1A1A35' }}>
            <div className="h-1.5 rounded-full progress-bar"
              style={{ width: `${Math.min(((d.calories || 0) / calGoal) * 100, 100)}%`, background: '#EF9F27' }} />
          </div>
          <div className="flex gap-4">
            {[
              { l: 'Carbs',   v: `${Math.round(d.carbs   || 0)}g`, c: '#EF9F27' },
              { l: 'Protein', v: `${Math.round(d.protein || 0)}g`, c: '#7B6FE8' },
              { l: 'Fats',    v: `${Math.round(d.fats    || 0)}g`, c: '#E24B4A' },
            ].map(m => (
              <div key={m.l} className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: m.c }} />
                <span style={{ color: '#7A7A9A', fontSize: 10 }}>{m.l}</span>
                <span style={{ color: '#E2E2F0', fontSize: 10, fontWeight: 600 }}>{m.v}</span>
              </div>
            ))}
          </div>
        </ClickCard>

        {/* ── Study Hours (live data) ── */}
        <ClickCard
          onClick={() => router.push('/study')}
          className="p-4 mb-3 animate-stagger-4 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(123,111,232,0.12)' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7B6FE8" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 14, fontFamily: 'Syne, sans-serif' }}>Study Hours</p>
              <p style={{ color: '#7A7A9A', fontSize: 11 }}>
                {studyToday?.logs?.length || 0} session{(studyToday?.logs?.length || 0) !== 1 ? 's' : ''} today
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 22 }}>
                {studySecs >= 3600 ? studyH : Math.round(studySecs / 60) + 'm'}
              </span>
              {studySecs >= 3600 && <span style={{ color: '#7A7A9A', fontSize: 13 }}>/6h</span>}
            </div>
            <div className="flex gap-1 justify-end mt-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full"
                  style={{ background: i < Math.ceil(studyPct * 3) ? '#7B6FE8' : '#2A2A4A' }} />
              ))}
            </div>
          </div>
        </ClickCard>

        {/* ── Weight Tracking ── */}
        <ClickCard onClick={() => router.push('/settings')} className="p-4 animate-stagger-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Progress Tracking
              </p>
              <h3 className="font-bold text-lg" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                Weight Tracking
              </h3>
            </div>
            <div className="text-right">
              <span className="font-bold" style={{ color: '#9B8FF8', fontFamily: 'Syne, sans-serif', fontSize: 18 }}>
                {weightDelta}
              </span>
              <p style={{ color: '#7A7A9A', fontSize: 10, marginTop: 1 }}>this period</p>
            </div>
          </div>
          <WeightBars history={weightHistory} />
        </ClickCard>

        {/* ── Quick actions row ── */}
        <div className="grid grid-cols-4 gap-2 mt-3 animate-stagger-6">
          {[
            { icon: '📊', label: 'Vault',    href: '/history' },
            { icon: '🏋️', label: 'History',  href: '/workout/history' },
            { icon: '🔔', label: 'Alerts',   href: '/notifications' },
            { icon: '⚙️', label: 'Settings', href: '/settings' },
          ].map(item => (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className="rounded-xl py-3 flex flex-col items-center gap-1 transition-all active:scale-90 hover:opacity-80"
              style={{ background: '#13132A', border: '1px solid #2A2A4A' }}
            >
              <span style={{ fontSize: 18 }}>{item.icon}</span>
              <span style={{ color: '#4A4A6A', fontSize: 10, fontWeight: 500 }}>{item.label}</span>
            </button>
          ))}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
