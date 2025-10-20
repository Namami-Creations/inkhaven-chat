'use client'

import { useEffect, useState } from 'react'
import { useSupabase } from './SupabaseProvider'

interface AdBannerProps {
  adSlot?: string
  adFormat?: string
  position?: 'sidebar' | 'banner' | 'inline'
  showForAnonymous?: boolean
}

export default function AdBanner({
  adSlot = '1234567890',
  adFormat = 'auto',
  position = 'banner',
  showForAnonymous = true
}: AdBannerProps) {
  const [adLoaded, setAdLoaded] = useState(false)
  const [shouldShowAds, setShouldShowAds] = useState(false)
  const { user } = useSupabase()

  const adClient = 'ca-pub-7229649791586904' // Your AdSense publisher ID

  const fullWidthResponsive = adFormat === 'auto' ? 'true' : 'false'

  // AdSense configuration based on position
  const getAdConfig = () => {
    switch (position) {
      case 'sidebar':
        return {
          style: 'display:block;width:300px;height:250px;',
          'data-ad-format': 'rectangle'
        }
      case 'banner':
        return {
          style: 'display:block;',
          'data-ad-format': 'horizontal'
        }
      case 'inline':
        return {
          style: 'display:block;text-align:center;',
          'data-ad-format': 'fluid'
        }
      default:
        return {
          style: 'display:block;',
          'data-ad-format': adFormat
        }
    }
  }

  const adConfig = getAdConfig()

  // Check if user should see ads
  const checkAdVisibility = () => {
    // Show ads for anonymous users or based on user preferences
    // You can extend this logic based on your monetization strategy
    const showAds = showForAnonymous || isUserPremium()
    setShouldShowAds(showAds)
  }

  // Check if user has premium status
  const isUserPremium = (): boolean => {
    // Implement your premium user check logic here
    // For now, return false (show ads to everyone)
    return false
  }

  // Load AdSense ad
  const loadAd = () => {
    // Check if AdSense is available
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        setAdLoaded(true)
      } catch (error) {
        console.error('AdSense ad failed to load:', error)
        setAdLoaded(false)
      }
    } else {
      // Retry loading ad after a short delay
      setTimeout(loadAd, 1000)
    }
  }

  useEffect(() => {
    checkAdVisibility()

    if (shouldShowAds) {
      // Load ad after component is mounted
      const timer = setTimeout(() => {
        loadAd()
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [shouldShowAds])

  useEffect(() => {
    if (shouldShowAds) {
      loadAd()
    }
  }, [position])

  if (!shouldShowAds) return null

  return (
    <div className="ad-banner-container">
      {/* Responsive AdSense Ad Unit */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block', ...adConfig.style }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={adConfig['data-ad-format']}
        data-full-width-responsive={fullWidthResponsive}
      />

      {/* Fallback for when ads don't load */}
      {!adLoaded && (
        <div className="ad-fallback">
          <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
            Advertisement
          </div>
        </div>
      )}

      <style jsx>{`
        .ad-banner-container {
          @apply my-4 mx-auto max-w-full overflow-hidden;
        }

        .ad-fallback {
          @apply bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg;
          min-height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* AdSense responsive styles */
        @media (max-width: 768px) {
          .ad-banner-container {
            @apply px-2;
          }
        }

        /* Hide ads on very small screens if needed */
        @media (max-width: 320px) {
          .ad-banner-container {
            display: none;
          }
        }
      `}</style>
    </div>
  )
}
