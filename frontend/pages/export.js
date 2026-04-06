import { useState } from 'react'
import { useRouter } from 'next/router'
import BottomNav from '../components/BottomNav'
import { useToast } from '../components/Toast'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

async function fetchAll() {
  const endpoints = [
    { key: 'user',       path: '/user'             },
    { key: 'sessions',   path: '/sessions/history' },
    { key: 'nutrients',  path: '/nutrients/today'  },
    { key: 'water',      path: '/water/week'       },
    { key: 'weight',     path: '/weight/history'   },
    { key: 'study_week', path: '/study/week'       },
    { key: 'analytics',  path: '/analytics/weekly' },
  ]
  const results = {}
  await Promise.allSettled(
    endpoints.map(async ({ key, path }) => {
      const r = await fetch(`${BASE}${path}`)
      results[key] = await r.json()
    })
  )
  return results
}

function toCSV(rows, keys) {
  if (!rows || !rows.length) return ''
  const header = keys.join(',')
  const lines = rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))
  return [header, ...lines].join('\n')
}

function downloadBlob(content, filename, type = 'application/json') {
  const blob = new Blob([content], { type })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

export default function ExportPage() {
  const router  = useRouter()
  const toast   = useToast()
  const [busy,  setBusy]  = useState(false)
  const [done,  setDone]  = useState(false)

  async function handleExportJSON() {
    setBusy(true)
    try {
      const data = await fetchAll()
      data.exported_at = new Date().toISOString()
      data.app = 'Obsidian Lens'
      downloadBlob(JSON.stringify(data, null, 2), `obsidian_lens_export_${new Date().toISOString().split('T')[0]}.json`)
      toast('JSON export downloaded!', 'success')
      setDone(true)
    } catch {
      toast('Export failed — is the backend running?', 'error')
    } finally { setBusy(false) }
  }

  async function handleExportCSV() {
    setBusy(true)
    try {
      const data = await fetchAll()
      const parts = []

      // Sessions CSV
      if (data.sessions?.length) {
        parts.push('# Workout Sessions')
        parts.push(toCSV(data.sessions, ['id','date','muscle_group','duration_seconds','completed']))
      }

      // Weight CSV
      if (data.weight?.length) {
        parts.push('\n# Weight Log')
        parts.push(toCSV(data.weight, ['date','weight']))
      }

      // Water CSV
      if (data.water?.length) {
        parts.push('\n# Water Log')
        parts.push(toCSV(data.water, ['date','amount_ml']))
      }

      // Study CSV
      if (data.study_week?.length) {
        parts.push('\n# Study Log')
        parts.push(toCSV(data.study_week, ['date','subject','seconds']))
      }

      downloadBlob(parts.join('\n'), `obsidian_lens_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv')
      toast('CSV export downloaded!', 'success')
      setDone(true)
    } catch {
      toast('Export failed — is the backend running?', 'error')
    } finally { setBusy(false) }
  }

  function handleClearData() {
    if (!confirm('This will delete all locally cached data (split, PBs, measurements, study logs). Backend data is kept. Continue?')) return
    const keys = ['ob_split','ob_exercise_pbs','ob_measurements','ob_study_logs','ob_notif_prefs']
    keys.forEach(k => localStorage.removeItem(k))
    toast('Local data cleared', 'info')
  }

  function handleResetOnboarding() {
    localStorage.removeItem('ob_onboarded')
    toast('Onboarding reset — reload to see it', 'info')
  }

  const EXPORT_ITEMS = [
    { icon: '💪', label: 'Workout sessions', desc: 'All sessions with muscle groups and durations' },
    { icon: '🥗', label: 'Nutrition logs',   desc: 'Food entries with calories and macros' },
    { icon: '💧', label: 'Water intake',     desc: 'Daily hydration log for last 7 days' },
    { icon: '⚖️', label: 'Weight history',   desc: 'Last 14 weight entries' },
    { icon: '📚', label: 'Study sessions',   desc: 'Focus sessions with subjects and durations' },
    { icon: '👤', label: 'Profile & goals',  desc: 'Your stats, goal, and calculated targets' },
  ]

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
            <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data</p>
            <h1 className="font-bold text-xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>Export & Privacy</h1>
          </div>
        </div>

        {/* What's included */}
        <div className="rounded-2xl p-4 mb-4 card-glow animate-stagger-2" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            What's included in export
          </p>
          {EXPORT_ITEMS.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3 py-2.5"
              style={{ borderBottom: i < EXPORT_ITEMS.length - 1 ? '1px solid #1A1A35' : 'none' }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 500 }}>{item.label}</p>
                <p style={{ color: '#4A4A6A', fontSize: 11, marginTop: 1 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Export buttons */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-3" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Download your data
          </p>

          <button onClick={handleExportJSON} disabled={busy}
            className="w-full py-3.5 rounded-xl font-bold text-white btn-purple mb-3 disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ fontSize: 14 }}>
            {busy
              ? <div className="w-4 h-4 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                  </svg>
                  Export as JSON
                </>
            }
          </button>

          <button onClick={handleExportCSV} disabled={busy}
            className="w-full py-3 rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2 transition-all hover:opacity-80"
            style={{ background: 'rgba(123,111,232,0.1)', color: '#9B8FF8', border: '1px solid rgba(123,111,232,0.25)', fontSize: 14 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export as CSV (spreadsheet)
          </button>

          {done && (
            <p className="text-center mt-3 text-xs font-semibold" style={{ color: '#1D9E75' }}>
              ✓ File saved to your downloads folder
            </p>
          )}
        </div>

        {/* Privacy section */}
        <div className="rounded-2xl p-4 mb-4 animate-stagger-4" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
            Privacy & data control
          </p>
          <p style={{ color: '#7A7A9A', fontSize: 12, lineHeight: 1.7, marginBottom: 16 }}>
            All data is stored locally on your device (SQLite database + localStorage). Nothing is sent to external servers. Obsidian Lens has no analytics, no ads, no cloud sync.
          </p>
          <div className="flex flex-col gap-2">
            <button onClick={handleResetOnboarding}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(239,159,39,0.08)', color: '#EF9F27', border: '1px solid rgba(239,159,39,0.2)' }}>
              Reset onboarding flow
            </button>
            <button onClick={handleClearData}
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ background: 'rgba(226,75,74,0.08)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)' }}>
              Clear local cache
            </button>
          </div>
        </div>

        {/* Storage info */}
        <div className="rounded-2xl p-4 animate-stagger-5" style={{ background: '#13132A', border: '1px solid #2A2A4A' }}>
          <p style={{ color: '#4A4A6A', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Data storage
          </p>
          {[
            { icon: '🗄️', label: 'Backend DB',    val: 'SQLite (obsidian.db)',   sub: 'Workouts, nutrition, water, weight' },
            { icon: '💾', label: 'Local cache',   val: 'localStorage',           sub: 'Split, PBs, measurements, study' },
            { icon: '📡', label: 'Cloud sync',    val: 'None',                   sub: 'All data stays on your device' },
            { icon: '🔒', label: 'Encryption',    val: 'None (local only)',      sub: 'No accounts, no passwords' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-3 py-2.5" style={{ borderBottom: '1px solid #1A1A35' }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{item.icon}</span>
              <div className="flex-1">
                <p style={{ color: '#7A7A9A', fontSize: 12 }}>{item.label}</p>
              </div>
              <div className="text-right">
                <p style={{ color: '#E2E2F0', fontSize: 12, fontWeight: 600 }}>{item.val}</p>
                <p style={{ color: '#4A4A6A', fontSize: 10, marginTop: 1 }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
