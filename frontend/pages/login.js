import { useState } from 'react'
import { useRouter } from 'next/router'
import { login } from '../lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Please enter email and password'); return }
    setLoading(true)
    setError('')
    try {
      const res = await login(email.trim(), password)
      localStorage.setItem('ob_token', res.data.token)
      localStorage.setItem('ob_user',  JSON.stringify(res.data.user))
      localStorage.setItem('ob_onboarded', '1')

      if (!res.data.setup_complete) {
        router.push('/setup')
      } else {
        router.push('/')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your email and password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: '#0D0D1A' }}>
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-3xl"
            style={{ background: 'rgba(123,111,232,0.12)', border: '1px solid rgba(123,111,232,0.25)' }}>
            🏔️
          </div>
          <h1 className="font-bold text-2xl" style={{ fontFamily: 'Syne, sans-serif', color: '#E2E2F0' }}>
            Obsidian Lens
          </h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, marginTop: 4 }}>Sign in to your vault</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-3">
          <div>
            <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none text-sm"
              style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A', fontSize: 15 }}
            />
          </div>

          <div>
            <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Password
            </label>
            <div className="relative mt-1.5">
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-xl outline-none text-sm pr-12"
                style={{ background: '#13132A', color: '#E2E2F0', border: '1px solid #2A2A4A', fontSize: 15 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#4A4A6A', fontSize: 12 }}
              >
                {showPass ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl text-sm"
              style={{ background: 'rgba(226,75,74,0.1)', color: '#E24B4A', border: '1px solid rgba(226,75,74,0.2)' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl font-bold text-white btn-purple disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
            style={{ fontSize: 15 }}
          >
            {loading
              ? <div className="w-5 h-5 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: '#2A2A4A' }} />
          <span style={{ color: '#4A4A6A', fontSize: 12 }}>or</span>
          <div className="flex-1 h-px" style={{ background: '#2A2A4A' }} />
        </div>

        {/* Register link */}
        <button
          onClick={() => router.push('/register')}
          className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-80"
          style={{ background: '#13132A', color: '#9B8FF8', border: '1px solid #2A2A4A', fontSize: 15 }}
        >
          Create new account
        </button>

        <p className="text-center mt-5" style={{ color: '#4A4A6A', fontSize: 12 }}>
          Your data is private and stored securely
        </p>
      </div>
    </div>
  )
}
