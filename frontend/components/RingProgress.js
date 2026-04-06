export default function RingProgress({ value = 0, max = 100, size = 72, strokeWidth = 6, color = '#7B6FE8', label, sublabel }) {
  const pct = Math.min(value / Math.max(max, 1), 1)
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - pct)

  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={strokeWidth}
          stroke="rgba(123,111,232,0.12)"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={strokeWidth}
          stroke={color}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute text-center px-1">
        {label && (
          <div
            className="font-bold leading-none"
            style={{ color: '#E2E2F0', fontSize: size > 80 ? 18 : size > 60 ? 14 : 11, fontFamily: 'Syne, sans-serif' }}
          >
            {label}
          </div>
        )}
        {sublabel && (
          <div style={{ color: '#7A7A9A', fontSize: 9, marginTop: 2 }}>{sublabel}</div>
        )}
      </div>
    </div>
  )
}
