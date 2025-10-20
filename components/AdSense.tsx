'use client'

import { useEffect } from 'react'

interface AdSenseProps {
  slot: string
  style?: React.CSSProperties
  format?: string
  responsive?: boolean
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: any[]
  }
}

export default function AdSense({
  slot,
  style = { display: 'block' },
  format = 'auto',
  responsive = true,
  className = ''
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({})
      }
    } catch (err) {
      console.error('AdSense error:', err)
    }
  }, [])

  if (typeof window === 'undefined') {
    return null
  }

  return (
    <div className={className}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-7229649791586904"}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive.toString()}
      />
    </div>
  )
}

// Pre-configured AdSense components
export function SidebarAd() {
  return (
    <div className="w-full max-w-xs">
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT_SIDEBAR || "1234567890"}
        style={{ display: 'block', minHeight: '300px' }}
        format="auto"
        className="bg-white/5 rounded-lg overflow-hidden"
      />
    </div>
  )
}

export function BannerAd() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <AdSense
        slot={process.env.NEXT_PUBLIC_ADSENSE_AD_SLOT_BANNER || "0987654321"}
        style={{ display: 'block', minHeight: '90px' }}
        format="horizontal"
        className="bg-white/5 rounded-lg overflow-hidden"
      />
    </div>
  )
}

// AdSense initialization script component
export function AdSenseScript() {
  useEffect(() => {
    // Load AdSense script
    const script = document.createElement('script')
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    script.async = true
    script.crossOrigin = 'anonymous'
    script.setAttribute('data-ad-client', process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || "ca-pub-7229649791586904")

    // Add to head if not already present
    if (!document.querySelector('script[src*="googlesyndication"]')) {
      document.head.appendChild(script)
    }
  }, [])

  return null
}
