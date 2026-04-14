import { useState } from 'react'
import { useRouter } from 'next/router'
import { register } from '../lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [showPass, setShowPass] = useState(false)

  async function handleRegister(e) {
    e.preventDefault()
    setError('')

    if (!email || !password) { setError('Please fill in all fields'); return }
    if (!email.includes('@')) { setError('Please enter a valid email'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (password !== confirm) { setError('Passwords do not match'); return }

    setLoading(true)
    try {
      const res = await register(email.trim(), password)
      localStorage.setItem('ob_token', res.data.token)
      localStorage.setItem('ob_user',  JSON.stringify(res.data.user))
      localStorage.setItem('ob_onboarded', '1')
      // New users always go to setup
      router.push('/setup')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3
  const strengthLabel = ['', 'Weak', 'Good', 'Strong']
  const strengthColor = ['', '#E24B4A', '#EF9F27', '#1D9E75']

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
            Create Account
          </h1>
          <p style={{ color: '#7A7A9A', fontSize: 14, marginTop: 4 }}>
            Start tracking your performance
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleRegister} className="flex flex-col gap-3">
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
                placeholder="Min. 6 characters"
                autoComplete="new-password"
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
            {password.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[1,2,3].map(i => (
                    <div key={i} className="flex-1 h-1 rounded-full"
                      style={{ background: i <= strength ? strengthColor[strength] : '#2A2A4A', transition: 'background 0.3s' }} />
                  ))}
                </div>
                <span style={{ color: strengthColor[strength], fontSize: 11, fontWeight: 600 }}>
                  {strengthLabel[strength]}
                </span>
              </div>
            )}
          </div>

          <div>
            <label style={{ color: '#4A4A6A', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Confirm Password
            </label>
            <input
              type={showPass ? 'text' : 'password'}
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="••••••••"
              autoComplete="new-password"
              className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none text-sm"
              style={{
                background: '#13132A',
                color: '#E2E2F0',
                border: `1px solid ${confirm && confirm !== password ? 'rgba(226,75,74,0.5)' : '#2A2A4A'}`,
                fontSize: 15,
              }}
            />
            {confirm && confirm !== password && (
              <p style={{ color: '#E24B4A', fontSize: 11, marginTop: 4 }}>Passwords do not match</p>
            )}
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
              : 'Create Account'}
          </button>
        </form>

        {/* Login link */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: '#2A2A4A' }} />
          <span style={{ color: '#4A4A6A', fontSize: 12 }}>already have an account?</span>
          <div className="flex-1 h-px" style={{ background: '#2A2A4A' }} />
        </div>

        <button
          onClick={() => router.push('/login')}
          className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-80"
          style={{ background: '#13132A', color: '#9B8FF8', border: '1px solid #2A2A4A', fontSize: 15 }}
        >
          Sign in instead
        </button>
      </div>
    </div>
  )
}
