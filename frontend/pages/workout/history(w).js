import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../../components/BottomNav'
import { useToast } from '../../components/Toast'
import { getSessionHistory } from '../../lib/api'

const MUSCLE_COLORS = {
  Chest: '#E24B4A',
  Back: '#7B6FE8',
  Shoulder: '#EF9F27',
  Arms: '#1D9E75',
  Legs: '#378ADD',
  Core: '#D4537E',
  Rest: '#4A4A6A',
}

const MUSCLE_ICONS = {
  Chest: '🏋️', Back: '🔙', Shoulder: '💪', Arms: '💪', Legs: '🦵', Core: '🔥', Rest: '😴',
}

function durationLabel(seconds) {
  if (!seconds) return '—'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  if (m === 0) return `${s}s`
  return s > 0 ? `${m}m ${s}s` : `${m}m`
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (dateStr === today.toISOString().split('T')[0]) return 'Today'
  if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false)
  const color = MUSCLE_COLORS[session.muscle_group] || '#7B6FE8'
  const icon = MUSCLE_ICONS[session.muscle_group] || '💪'

  return (
    <div
      className="rounded-2xl mb-3 overflow-hidden transition-all"
      style={{ background: '#13132A', border: `1px solid ${expanded ? color + '44' : '#2A2A4A'}` }}
    >
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 p-4 text-left"
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${color}18` }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 15 }}>
            {session.muscle_group} Day
          </p>
          <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>
            {formatDate(session.date)}
            {session.duration_seconds > 0 && (
              <> · {durationLabel(session.duration_seconds)}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {session.completed ? (
            <div
              className="px-2.5 py-1 rounded-lg flex items-center gap-1"
              style={{ background: 'rgba(29,158,117,0.12)', border: '1px solid rgba(29,158,117,0.25)' }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <span style={{ color: '#1D9E75', fontSize: 10, fontWeight: 700 }}>Done</span>
            </div>
          ) : (
            <div
              className="px-2.5 py-1 rounded-lg"
              style={{ background: 'rgba(239,159,39,0.1)', border: '1px solid rgba(239,159,39,0.2)' }}
            >
              <span style={{ color: '#EF9F27', fontSize: 10, fontWeight: 700 }}>Partial</span>
            </div>
          )}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#4A4A6A" strokeWidth="2" strokeLinecap="round"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4" style={{ borderTop: '1px solid #1A1A35' }}>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Date', val: session.date },
              { label: 'Duration', val: durationLabel(session.duration_seconds) },
              { label: 'Status', val: session.completed ? 'Completed' : 'Incomplete' },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-2.5 text-center" style={{ background: '#1A1A35' }}>
                <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</p>
                <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600, marginTop: 3 }}>{item.val}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function WorkoutHistoryPage() {
  const router = useRouter()
  const toast  = useToast()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    getSessionHistory()
      .then(r => setSessions(r.data))
      .catch(() => {
        // Demo data
        const demo = ['Chest', 'Back', 'Shoulder', 'Arms', 'Legs', 'Core', 'Chest', 'Back']
        const today = new Date()
        setSessions(demo.map((m, i) => {
          const d = new Date(today)
          d.setDate(today.getDate() - i)
          return {
            id: i + 1,
            muscle_group: m,
            date: d.toISOString().split('T')[0],
            duration_seconds: 2400 + i * 180,
            completed: i % 5 !== 3,
          }
        }))
      })
      .finally(() => setLoading(false))
  }, [])

  const muscles = ['all', ...new Set(sessions.map(s => s.muscle_group))]
  const filtered = filter === 'all' ? sessions : sessions.filter(s => s.muscle_group === filter)

  const completedCount = sessions.filter(s => s.completed).length
  const totalDuration = sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0)
  const avgDuration = sessions.length ? Math.round(totalDuration / sessions.length) : 0

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
            <div>
              <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Training log</p>
              <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
                Workout History
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/workout/split')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(123,111,232,0.1)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.2)' }}
            >
              Split
            </button>
            <button
              onClick={() => router.push('/workout/progress')}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,159,39,0.1)', color: '#EF9F27', border: '1px solid rgba(239,159,39,0.2)' }}
            >
              🏆 PBs
            </button>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-4 animate-stagger-2">
          {[
            { label: 'Total', val: sessions.length, unit: 'sessions' },
            { label: 'Completed', val: completedCount, unit: 'done' },
            { label: 'Avg time', val: durationLabel(avgDuration), unit: 'per session' },
          ].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
              <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              <p className="font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 18 }}>{s.val}</p>
              <p style={{ color: '#7A7A9A', fontSize: 10, marginTop: 1 }}>{s.unit}</p>
            </div>
          ))}
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 animate-stagger-3" style={{ scrollbarWidth: 'none' }}>
          {muscles.map(m => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition-all"
              style={{
                background: filter === m
                  ? (m === 'all' ? '#7B6FE8' : MUSCLE_COLORS[m] || '#7B6FE8')
                  : '#13132A',
                color: filter === m ? '#fff' : '#7A7A9A',
                border: `1px solid ${filter === m ? 'transparent' : '#2A2A4A'}`,
                textTransform: 'capitalize',
              }}
            >
              {m === 'all' ? 'All' : m}
            </button>
          ))}
        </div>

        {/* Session list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🏋️</div>
            <p style={{ color: '#7A7A9A', fontSize: 14 }}>No sessions yet</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 px-6 py-3 rounded-xl font-bold text-white btn-purple text-sm"
            >
              Start a session
            </button>
          </div>
        ) : (
          filtered.map(s => <SessionCard key={s.id} session={s} />)
        )}

      </div>
      <BottomNav />
    </div>
  )
}
