import { useMemo } from 'react'

function linearRegression(points) {
  // points: [{x: number, y: number}]
  const n = points.length
  if (n < 2) return null
  const sumX  = points.reduce((a, p) => a + p.x, 0)
  const sumY  = points.reduce((a, p) => a + p.y, 0)
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0)
  const sumXX = points.reduce((a, p) => a + p.x * p.x, 0)
  const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const b = (sumY - m * sumX) / n
  return { slope: m, intercept: b, predict: x => m * x + b }
}

function TrendArrow({ slope, size = 16 }) {
  if (Math.abs(slope) < 0.01) return <span style={{ color: '#7A7A9A', fontSize: size }}>→</span>
  const up = slope > 0
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={up ? '#E24B4A' : '#1D9E75'} strokeWidth="2.5" strokeLinecap="round">
      {up ? <path d="M12 19V5M5 12l7-7 7 7"/> : <path d="M12 5v14M5 12l7 7 7-7"/>}
    </svg>
  )
}

export default function WeightTrendPredictor({ history = [], goalWeight = null, currentGoal = 'gain' }) {
  const analysis = useMemo(() => {
    if (history.length < 2) return null

    // Build x = days from first entry, y = weight
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date))
    const t0 = new Date(sorted[0].date).getTime()
    const points = sorted.map(e => ({
      x: (new Date(e.date).getTime() - t0) / 86400000,
      y: e.weight,
    }))

    const reg = linearRegression(points)
    if (!reg) return null

    const lastX = points[points.length - 1].x
    const currentWeight = sorted[sorted.length - 1].weight
    const weeklyChange = reg.slope * 7

    const projections = [4, 8, 12].map(weeks => ({
      weeks,
      weight: parseFloat((reg.predict(lastX + weeks * 7)).toFixed(1)),
    }))

    const daysToGoal = goalWeight != null && Math.abs(reg.slope) > 0.001
      ? Math.round((goalWeight - reg.predict(lastX)) / reg.slope)
      : null

    return { reg, currentWeight, weeklyChange, projections, daysToGoal, slope: reg.slope }
  }, [history, goalWeight])

  if (!analysis) return (
    <div className="rounded-xl p-4 text-center" style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}>
      <p style={{ color: '#4A4A6A', fontSize: 12 }}>Log at least 2 weight entries to see trend predictions</p>
    </div>
  )

  const { currentWeight, weeklyChange, projections, daysToGoal, slope } = analysis
  const trend = weeklyChange > 0.1 ? 'gaining' : weeklyChange < -0.1 ? 'losing' : 'maintaining'
  const trendColor = currentGoal === 'gain'
    ? (trend === 'gaining' ? '#1D9E75' : '#E24B4A')
    : currentGoal === 'cut'
    ? (trend === 'losing' ? '#1D9E75' : '#E24B4A')
    : '#7A7A9A'

  return (
    <div>
      {/* Summary row */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: `${trendColor}10`, border: `1px solid ${trendColor}30` }}>
        <TrendArrow slope={slope} size={20} />
        <div className="flex-1">
          <p className="font-semibold" style={{ color: '#E2E2F0', fontSize: 13 }}>
            {trend === 'gaining' ? 'Gaining' : trend === 'losing' ? 'Losing' : 'Stable'} at {Math.abs(weeklyChange).toFixed(2)} kg/week
          </p>
          <p style={{ color: '#7A7A9A', fontSize: 11, marginTop: 1 }}>
            {currentGoal === 'gain' && trend === 'gaining' && 'On track for muscle gain ✓'}
            {currentGoal === 'gain' && trend === 'losing'  && 'You may be in a deficit — increase calories'}
            {currentGoal === 'cut'  && trend === 'losing'  && 'On track for fat loss ✓'}
            {currentGoal === 'cut'  && trend === 'gaining' && 'You may be eating too much — check macros'}
            {currentGoal === 'maintain' && 'Maintaining weight'}
          </p>
        </div>
      </div>

      {/* Projections */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {projections.map(p => (
          <div key={p.weeks} className="rounded-xl p-3 text-center" style={{ background: '#1A1A35', border: '1px solid #2A2A4A' }}>
            <p style={{ color: '#4A4A6A', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{p.weeks} weeks</p>
            <p className="font-bold mt-1" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 17 }}>{p.weight}</p>
            <p style={{ color: '#7A7A9A', fontSize: 9, marginTop: 1 }}>kg projected</p>
            <p style={{
              fontSize: 9, fontWeight: 700, marginTop: 2,
              color: p.weight > currentWeight ? '#E24B4A' : p.weight < currentWeight ? '#1D9E75' : '#7A7A9A',
            }}>
              {p.weight > currentWeight ? '+' : ''}{(p.weight - currentWeight).toFixed(1)} kg
            </p>
          </div>
        ))}
      </div>

      {/* Goal ETA */}
      {goalWeight != null && daysToGoal != null && daysToGoal > 0 && daysToGoal < 365 && (
        <div className="rounded-xl p-3 flex items-center gap-3" style={{ background: 'rgba(123,111,232,0.08)', border: '1px solid rgba(123,111,232,0.2)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7B6FE8" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <div>
            <p style={{ color: '#9B8FF8', fontSize: 12, fontWeight: 600 }}>
              ~{daysToGoal} days to reach {goalWeight} kg goal
            </p>
            <p style={{ color: '#7A7A9A', fontSize: 10, marginTop: 1 }}>
              Est. {new Date(Date.now() + daysToGoal * 86400000).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
