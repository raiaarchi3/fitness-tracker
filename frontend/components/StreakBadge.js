export default function StreakBadge({ streak = 0, size = 'md' }) {
  const isLarge = size === 'lg'
  return (
    <div
      className="flex items-center gap-1.5 rounded-full streak-glow transition-all"
      style={{
        background: 'rgba(239,159,39,0.12)',
        border: '1px solid rgba(239,159,39,0.3)',
        padding: isLarge ? '6px 14px' : '4px 10px',
      }}
    >
      <svg
        width={isLarge ? 16 : 13}
        height={isLarge ? 16 : 13}
        viewBox="0 0 24 24"
        fill="#EF9F27"
      >
        <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7z" />
      </svg>
      <span
        className="font-bold"
        style={{
          color: '#EF9F27',
          fontSize: isLarge ? 15 : 12,
          letterSpacing: '0.02em',
        }}
      >
        {streak}-Day
      </span>
    </div>
  )
}
