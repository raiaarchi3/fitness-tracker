import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { getStatsOverview, getWeightHistory, getSessionHistory } from '../lib/api'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function StatCard({ icon, label, value, sub, color = '#7B6FE8' }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
      <div className="flex items-center gap-2 mb-2">
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      </div>
      <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color, fontSize: 28, lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 4 }}>{sub}</p>}
    </div>
  )
}

function AchievementBadge({ emoji, title, desc, unlocked }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: unlocked ? 'rgba(123,111,232,0.08)' : '#13132A', border: `1px solid ${unlocked ? 'rgba(123,111,232,0.25)' : '#1A1A35'}`, opacity: unlocked ? 1 : 0.45 }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: unlocked ? 'rgba(123,111,232,0.12)' : '#1A1A35', filter: unlocked ? 'none' : 'grayscale(1)' }}>
        {emoji}
      </div>
      <div>
        <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 600 }}>{title}</p>
        <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>{desc}</p>
      </div>
      {unlocked && (
        <div className="ml-auto flex-shrink-0">
          <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#7B6FE8' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
          </div>
        </div>
      )}
    </div>
  )
}

export default function StatsPage() {
  const router = useRouter()
  const [overview, setOverview] = useState(null)
  const [weight,   setWeight]   = useState([])
  const [sessions, setSessions] = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.allSettled([
      getStatsOverview(),
      getWeightHistory(),
      getSessionHistory(),
    ]).then(([o, w, s]) => {
      if (o.status === 'fulfilled') setOverview(o.value.data)
      if (w.status === 'fulfilled') setWeight(w.value.data)
      if (s.status === 'fulfilled') setSessions(s.value.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }} />
    </div>
  )

  const ov = overview || {}
  const totalSessions = ov.total_sessions   || sessions.length  || 0
  const completed     = ov.total_completed  || 0
  const streak        = ov.streak           || 0
  const waterL        = ov.total_water_l    || 0
  const studyH        = ov.total_study_hours|| 0
  const completionRate= ov.completion_rate  || (totalSessions > 0 ? Math.round(completed/totalSessions*100) : 0)

  // Muscle group breakdown from sessions
  const muscleCount = {}
  sessions.forEach(s => { muscleCount[s.muscle_group] = (muscleCount[s.muscle_group] || 0) + 1 })
  const topMuscle = Object.entries(muscleCount).sort((a,b) => b[1]-a[1])[0]

  // Weight change
  const weightChange = weight.length >= 2
    ? (weight[0].weight - weight[weight.length-1].weight).toFixed(1)
    : null

  // Achievements
  const achievements = [
    { emoji: '🔥', title: 'First session', desc: 'Complete your first workout', unlocked: totalSessions >= 1 },
    { emoji: '⚡', title: 'Week warrior', desc: 'Log 7 workouts total', unlocked: totalSessions >= 7 },
    { emoji: '💎', title: 'Monthly grind', desc: '30 workouts completed', unlocked: completed >= 30 },
    { emoji: '🏆', title: 'Century club', desc: '100 sessions done', unlocked: completed >= 100 },
    { emoji: '🌊', title: 'Hydration hero', desc: 'Log 100L of water total', unlocked: waterL >= 100 },
    { emoji: '📚', title: 'Scholar', desc: '10 hours of study tracked', unlocked: studyH >= 10 },
    { emoji: '🎯', title: 'Consistent', desc: '7-day workout streak', unlocked: streak >= 7 },
    { emoji: '🦁', title: 'Iron will', desc: '30-day streak', unlocked: streak >= 30 },
    { emoji: '✅', title: 'Finisher', desc: '90% session completion rate', unlocked: completionRate >= 90 },
    { emoji: '🌱', title: 'Growth mindset', desc: 'Gained 2kg toward goal', unlocked: weightChange != null && Number(weightChange) < -2 },
  ]
  const unlockedCount = achievements.filter(a => a.unlocked).length

  return (
    <div className="min-h-screen" style={{ background: '#0D0D1A' }}>
      <div className="max-w-sm mx-auto px-4 pt-5 pb-28">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 animate-stagger-1">
          <button onClick={() => router.back()} style={{ color: '#7A7A9A' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </button>
          <div>
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>All time</p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Lifetime Stats</h1>
          </div>
        </div>

        {/* Hero stat */}
        <div className="rounded-2xl p-5 mb-4 card-glow animate-stagger-2 text-center"
          style={{ background: '#13132A', border: '1px solid rgba(123,111,232,0.3)' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
            Total sessions completed
          </p>
          <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 56, lineHeight: 1 }}>
            {completed}
          </p>
          <p style={{ color: '#7A7A9A', fontSize: 13, marginTop: 6 }}>
            out of {totalSessions} logged · {completionRate}% completion rate
          </p>
          <div className="h-2 rounded-full mt-4 overflow-hidden" style={{ background: '#1A1A35' }}>
            <div className="h-2 rounded-full" style={{ width: `${completionRate}%`, background: '#7B6FE8', transition: 'width 1s ease' }} />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-4 animate-stagger-3">
          <StatCard icon="⚡" label="Best streak"    value={streak}          sub="consecutive days" color="#EF9F27" />
          <StatCard icon="💧" label="Total water"    value={`${waterL}L`}    sub="logged in total"  color="#378ADD" />
          <StatCard icon="📚" label="Study hours"    value={`${studyH}h`}    sub="of focus time"    color="#7B6FE8" />
          <StatCard icon="🏋️" label="Fave muscle"   value={topMuscle?.[0] || '—'} sub={topMuscle ? `${topMuscle[1]} sessions` : 'No data'} color="#E24B4A" />
        </div>

        {/* Weight change */}
        {weightChange != null && (
          <div className="rounded-2xl p-4 mb-4 animate-stagger-3 flex items-center gap-4"
            style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(123,111,232,0.1)', flexShrink: 0 }}>
              ⚖️
            </div>
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Weight change (logged period)
              </p>
              <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, color: Number(weightChange) > 0 ? '#E24B4A' : '#1D9E75' }}>
                {Number(weightChange) > 0 ? '+' : ''}{weightChange} kg
              </p>
              <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>
                from {weight[weight.length-1]?.weight} → {weight[0]?.weight} kg
              </p>
            </div>
          </div>
        )}

        {/* Muscle breakdown */}
        {Object.keys(muscleCount).length > 0 && (
          <div className="rounded-2xl p-4 mb-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              Sessions by muscle group
            </p>
            {Object.entries(muscleCount)
              .sort((a,b) => b[1]-a[1])
              .map(([muscle, count]) => {
                const pct = Math.round((count / totalSessions) * 100)
                const COLORS = { Chest:'#E24B4A', Back:'#7B6FE8', Shoulder:'#EF9F27', Arms:'#1D9E75', Legs:'#378ADD', Core:'#D4537E', Rest:'#4A4A6A' }
                const color = COLORS[muscle] || '#7B6FE8'
                return (
                  <div key={muscle} className="mb-3">
                    <div className="flex justify-between mb-1">
                      <span style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 500 }}>{muscle}</span>
                      <span style={{ color: '#7A7A9A', fontSize: 12 }}>{count} sessions · {pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1A1A35' }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* Achievements */}
        <div className="animate-stagger-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 16 }}>Achievements</h3>
            <span style={{ color: '#7B6FE8', fontSize: 12, fontWeight: 600 }}>{unlockedCount}/{achievements.length} unlocked</span>
          </div>
          <div className="flex flex-col gap-2">
            {achievements.map(a => <AchievementBadge key={a.title} {...a} />)}
          </div>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
