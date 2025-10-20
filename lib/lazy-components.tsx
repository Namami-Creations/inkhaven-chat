// Lazy-loaded components for better performance
import dynamic from 'next/dynamic'
import { ComponentType } from 'react'

// Lazy load heavy components with loading fallbacks
export const LazyChatApp = dynamic(() => import('@/components/ChatApp'), {
  loading: () => <ChatAppSkeleton />,
  ssr: false, // Disable SSR for chat components
})

export const LazyEnhancedHomepage = dynamic(() => import('@/components/EnhancedHomepage'), {
  loading: () => <HomepageSkeleton />,
})

export const LazyChatInterface = dynamic(() => import('@/components/ChatInterface'), {
  loading: () => <ChatInterfaceSkeleton />,
})

export const LazyRoomBrowser = dynamic(() => import('@/components/RoomBrowser'), {
  loading: () => <RoomBrowserSkeleton />,
})

export const LazyThemeCustomizer = dynamic(() => import('@/components/ThemeCustomizer'), {
  loading: () => <ThemeCustomizerSkeleton />,
})

// Loading skeleton components
function ChatAppSkeleton() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-pulse">
        <div className="w-64 h-8 bg-gray-700 rounded mb-4"></div>
        <div className="w-48 h-4 bg-gray-700 rounded mb-8"></div>
        <div className="space-y-3">
          <div className="w-full h-12 bg-gray-700 rounded"></div>
          <div className="w-full h-12 bg-gray-700 rounded"></div>
          <div className="w-3/4 h-12 bg-gray-700 rounded"></div>
        </div>
      </div>
    </div>
  )
}

function HomepageSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="animate-pulse">
        {/* Header skeleton */}
        <div className="px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="w-32 h-8 bg-gray-700 rounded"></div>
            <div className="w-24 h-8 bg-gray-700 rounded"></div>
          </div>
        </div>

        {/* Hero section skeleton */}
        <div className="px-6 py-12 text-center">
          <div className="w-96 h-12 bg-gray-700 rounded mx-auto mb-4"></div>
          <div className="w-64 h-6 bg-gray-700 rounded mx-auto mb-8"></div>
          <div className="flex justify-center space-x-4">
            <div className="w-32 h-12 bg-gray-700 rounded"></div>
            <div className="w-32 h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatInterfaceSkeleton() {
  return (
    <div className="h-screen bg-gray-900 flex">
      {/* Sidebar skeleton */}
      <div className="w-80 bg-gray-800 border-r border-gray-700 p-4">
        <div className="animate-pulse space-y-3">
          <div className="w-full h-12 bg-gray-700 rounded"></div>
          <div className="w-full h-12 bg-gray-700 rounded"></div>
          <div className="w-full h-12 bg-gray-700 rounded"></div>
        </div>
      </div>

      {/* Chat area skeleton */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 p-4 space-y-4">
          <div className="animate-pulse">
            <div className="flex space-x-3 mb-4">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-24 h-4 bg-gray-700 rounded"></div>
                <div className="w-64 h-4 bg-gray-700 rounded"></div>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-gray-700 rounded"></div>
                <div className="w-48 h-4 bg-gray-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Input skeleton */}
        <div className="p-4 border-t border-gray-700">
          <div className="animate-pulse">
            <div className="w-full h-12 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RoomBrowserSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="w-48 h-8 bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-gray-800 rounded-lg p-4">
              <div className="w-32 h-6 bg-gray-700 rounded mb-2"></div>
              <div className="w-full h-4 bg-gray-700 rounded mb-3"></div>
              <div className="flex justify-between items-center">
                <div className="w-16 h-4 bg-gray-700 rounded"></div>
                <div className="w-20 h-8 bg-gray-700 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ThemeCustomizerSkeleton() {
  return (
    <div className="p-6">
      <div className="animate-pulse">
        <div className="w-48 h-8 bg-gray-700 rounded mb-6"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
