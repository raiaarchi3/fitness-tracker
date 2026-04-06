import { useEffect, useRef } from 'react'

export function useNotifications() {
  const swRef = useRef(null)

  useEffect(() => {
    registerSW()
  }, [])

  async function registerSW() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      swRef.current = reg
      console.log('[SW] Registered:', reg.scope)
    } catch (e) {
      console.warn('[SW] Registration failed:', e)
    }
  }

  async function requestPermission() {
    if (!('Notification' in window)) return false
    if (Notification.permission === 'granted') return true
    const result = await Notification.requestPermission()
    return result === 'granted'
  }

  async function enableReminders() {
    const granted = await requestPermission()
    if (!granted) return false
    // Tell the SW to start scheduling water reminders
    const reg = swRef.current || await navigator.serviceWorker.ready
    reg.active?.postMessage({ type: 'SCHEDULE_WATER' })

    // Schedule gym day notification for tomorrow 7am using setTimeout approximation
    scheduleGymNotification(reg)
    return true
  }

  function scheduleGymNotification(reg) {
    const now = new Date()
    const tomorrow7am = new Date(now)
    tomorrow7am.setDate(now.getDate() + 1)
    tomorrow7am.setHours(7, 0, 0, 0)
    const delay = tomorrow7am - now

    const SPLIT = { 1: 'Chest', 2: 'Back', 3: 'Shoulder', 4: 'Arms', 5: 'Legs', 6: 'Core', 0: 'Rest' }
    const tomorrowDay = (tomorrow7am.getDay())
    const muscle = SPLIT[tomorrowDay] || 'Rest'

    setTimeout(() => {
      if (Notification.permission === 'granted') {
        reg?.showNotification?.('Obsidian Lens 💪', {
          body: muscle === 'Rest'
            ? "Today is your rest day. Recovery is part of the process!"
            : `Today is your ${muscle} Day! Your session is ready.`,
          icon: '/icon-192.png',
          tag: 'gym-day',
          data: { url: '/' },
          vibrate: [200, 100, 200],
        })
      }
    }, Math.min(delay, 2147483647))
  }

  function sendTestNotification(title, body) {
    if (Notification.permission !== 'granted') return
    const reg = swRef.current
    if (reg) {
      reg.showNotification(title, { body, icon: '/icon-192.png', vibrate: [100] })
    } else {
      new Notification(title, { body, icon: '/icon-192.png' })
    }
  }

  return { enableReminders, requestPermission, sendTestNotification }
}
