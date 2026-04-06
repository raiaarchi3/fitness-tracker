import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'

export default function Custom404() {
  const router = useRouter()
  const [count, setCount] = useState(5)

  useEffect(() => {
    const t = setInterval(() => {
      setCount(c => {
        if (c <= 1) { clearInterval(t); router.push('/'); return 0 }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0D0D1A' }}>
      <div className="text-center max-w-xs">
        <div className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl"
          style={{ background: 'rgba(123,111,232,0.1)', border: '1px solid rgba(123,111,232,0.2)' }}>
          🔍
        </div>
        <h1 className="font-bold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0', fontSize: 28 }}>
          Page not found
        </h1>
        <p style={{ color: '#7A7A9A', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          This page doesn't exist in your vault. Redirecting home in {count}s...
        </p>
        <div className="h-1 rounded-full mb-6" style={{ background: '#1A1A35' }}>
          <div className="h-1 rounded-full" style={{ width: `${(1 - count / 5) * 100}%`, background: '#7B6FE8', transition: 'width 0.9s linear' }} />
        </div>
        <button onClick={() => router.push('/')}
          className="w-full py-3.5 rounded-xl font-bold text-white btn-purple" style={{ fontSize: 15 }}>
          Back to Home
        </button>
      </div>
    </div>
  )
}
