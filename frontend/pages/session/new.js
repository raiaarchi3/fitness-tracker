import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { startSession } from '../../lib/api'

export default function NewSession() {
  const router = useRouter()
  const { muscle } = router.query

  useEffect(() => {
    if (!router.isReady) return
    const muscleGroup = muscle || 'Chest'
    startSession(muscleGroup)
      .then(res => {
        router.replace(`/session/${res.data.session.id}`)
      })
      .catch(() => {
        // fallback: go to id=local with muscle param
        router.replace(`/session/local?muscle=${muscleGroup}`)
      })
  }, [router.isReady, muscle])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0D0D1A' }}>
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 mx-auto mb-4 animate-spin"
          style={{ borderColor: '#7B6FE8', borderTopColor: 'transparent' }}
        />
        <p style={{ color: '#7A7A9A', fontSize: 13 }}>Starting session...</p>
      </div>
    </div>
  )
}
