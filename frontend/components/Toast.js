import { useState, useEffect, createContext, useContext, useCallback } from 'react'

const ToastCtx = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const add = useCallback((msg, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random()
    setToasts(p => [...p, { id, msg, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), duration)
  }, [])

  const remove = useCallback((id) => setToasts(p => p.filter(t => t.id !== id)), [])

  const COLORS = {
    success: { bg: 'rgba(29,158,117,0.12)',  border: 'rgba(29,158,117,0.3)',  text: '#1D9E75',  icon: '✓' },
    error:   { bg: 'rgba(226,75,74,0.12)',   border: 'rgba(226,75,74,0.3)',   text: '#E24B4A',  icon: '✕' },
    info:    { bg: 'rgba(123,111,232,0.12)', border: 'rgba(123,111,232,0.3)', text: '#9B8FF8',  icon: 'ℹ' },
    warning: { bg: 'rgba(239,159,39,0.12)',  border: 'rgba(239,159,39,0.3)',  text: '#EF9F27',  icon: '⚠' },
  }

  return (
    <ToastCtx.Provider value={add}>
      {children}

      {/* Toast container */}
      <div
        style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8,
          width: 'min(calc(100vw - 32px), 360px)', pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const c = COLORS[t.type] || COLORS.info
          return (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px', borderRadius: 12,
                background: '#13132A',
                border: `1px solid ${c.border}`,
                boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
                pointerEvents: 'all', cursor: 'pointer',
                animation: 'fadeUp 0.25s ease forwards',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%',
                background: c.bg, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: c.text, flexShrink: 0,
              }}>
                {c.icon}
              </span>
              <span style={{ color: '#E2E2F0', fontSize: 13, fontWeight: 500, flex: 1 }}>{t.msg}</span>
              <span style={{ color: '#4A4A6A', fontSize: 11, flexShrink: 0 }}>tap to dismiss</span>
            </div>
          )
        })}
      </div>
    </ToastCtx.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) return (msg, type) => console.log(`[Toast ${type}]`, msg)
  return ctx
}
