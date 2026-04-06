import { useRouter } from 'next/router'

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6FE8' : '#4A4A6A'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function NutritionIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6FE8' : '#4A4A6A'} strokeWidth="2" strokeLinecap="round">
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
      <line x1="9" y1="9" x2="9.01" y2="9"/>
      <line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  )
}
function WorkoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
      <path d="M6 4v16M18 4v16M6 12h12"/>
      <path d="M2 9h4M18 9h4M2 15h4M18 15h4"/>
    </svg>
  )
}
function StudyIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6FE8' : '#4A4A6A'} strokeWidth="2" strokeLinecap="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>
  )
}
function VaultIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#7B6FE8' : '#4A4A6A'} strokeWidth="2" strokeLinecap="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  )
}

const NAV = [
  { href: '/', label: 'Home', Icon: HomeIcon },
  { href: '/nutrition', label: 'Nutrition', Icon: NutritionIcon },
  { href: '/session/new', label: 'Workout', Icon: WorkoutIcon, center: true },
  { href: '/study', label: 'Study', Icon: StudyIcon },
  { href: '/history', label: 'Vault', Icon: VaultIcon },
]

export default function BottomNav() {
  const router = useRouter()
  const path = router.pathname

  function isActive(href) {
    if (href === '/') return path === '/'
    return path.startsWith(href.split('/').slice(0, 2).join('/'))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex items-end justify-around"
      style={{
        background: 'rgba(13,13,26,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(42,42,74,0.8)',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        paddingTop: 10,
        paddingLeft: 4,
        paddingRight: 4,
      }}
    >
      {NAV.map(({ href, label, Icon, center }) => {
        const active = isActive(href)
        if (center) {
          return (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all active:scale-90 mb-1"
              style={{
                background: 'linear-gradient(135deg, #7B6FE8, #6C5CE7)',
                boxShadow: '0 4px 20px rgba(123,111,232,0.45)',
                marginTop: -22,
              }}
            >
              <Icon />
            </button>
          )
        }
        return (
          <button
            key={href}
            onClick={() => router.push(href)}
            className="flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all active:scale-90"
            style={{ minWidth: 44 }}
          >
            <Icon active={active} />
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: active ? '#7B6FE8' : '#4A4A6A',
                letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
