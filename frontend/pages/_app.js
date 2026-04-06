import '../styles/globals.css'
import { useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { ToastProvider } from '../components/Toast'

const NO_ONBOARD = ['/onboarding']

export default function App({ Component, pageProps }) {
  const router = useRouter()

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }
    try {
      const onboarded = localStorage.getItem('ob_onboarded')
      if (!onboarded && !NO_ONBOARD.includes(router.pathname)) {
        router.replace('/onboarding')
      }
    } catch {}
  }, [])

  return (
    <ToastProvider>
      <Head>
        <title>Obsidian Lens</title>
        <meta name="description" content="Your personal performance vault" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#7B6FE8" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Obsidian Lens" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap"
          rel="stylesheet"
        />
      </Head>
      <Component {...pageProps} />
    </ToastProvider>
  )
}
