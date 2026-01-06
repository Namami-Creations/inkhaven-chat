'use client'

import { useEffect, useRef, useState } from 'react'

type TurnstileProps = {
  siteKey: string
  onToken: (token: string) => void
  onError?: (message: string) => void
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, any>) => string
      remove?: (widgetId: string) => void
      reset?: (widgetId: string) => void
    }
  }
}

const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

export default function Turnstile({ siteKey, onToken, onError }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    const ensureScript = async () => {
      if (typeof window === 'undefined') return

      const existing = document.querySelector(`script[data-turnstile="true"]`) as HTMLScriptElement | null
      if (!existing) {
        const script = document.createElement('script')
        script.src = TURNSTILE_SRC
        script.async = true
        script.defer = true
        script.dataset.turnstile = 'true'
        script.onload = () => {
          if (!cancelled) setReady(true)
        }
        script.onerror = () => {
          onError?.('Failed to load Turnstile script.')
        }
        document.head.appendChild(script)
      } else {
        // If script already present, assume it might already be ready.
        setReady(true)
      }
    }

    void ensureScript()
    return () => {
      cancelled = true
    }
  }, [onError])

  useEffect(() => {
    if (!ready) return
    if (!containerRef.current) return

    const el = containerRef.current

    const tryRender = () => {
      if (!window.turnstile?.render) return false
      if (widgetIdRef.current) return true

      widgetIdRef.current = window.turnstile.render(el, {
        sitekey: siteKey,
        callback: (token: string) => {
          if (typeof token === 'string' && token.length > 0) onToken(token)
        },
        'error-callback': () => {
          onError?.('Turnstile failed. Please retry.')
        },
        'expired-callback': () => {
          onError?.('Turnstile expired. Please retry.')
        }
      })

      return true
    }

    // Turnstile may not be available immediately even after script load.
    const ok = tryRender()
    if (ok) return

    const interval = window.setInterval(() => {
      const done = tryRender()
      if (done) window.clearInterval(interval)
    }, 200)

    return () => {
      window.clearInterval(interval)
      if (widgetIdRef.current && window.turnstile?.remove) {
        try {
          window.turnstile.remove(widgetIdRef.current)
        } catch {
          // ignore
        }
      }
      widgetIdRef.current = null
    }
  }, [ready, siteKey, onToken, onError])

  return <div ref={containerRef} />
}
