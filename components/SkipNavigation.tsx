'use client'

import { useSkipLink } from '@/lib/accessibility'

export default function SkipNavigation() {
  const { handleSkip: handleSkipToMain } = useSkipLink('main-content')
  const { handleSkip: handleSkipToNav } = useSkipLink('navigation')

  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-br">
      <a
        href="#main-content"
        onKeyDown={handleSkipToMain}
        className="mr-4 hover:underline focus:underline"
      >
        Skip to main content
      </a>
      <a
        href="#navigation"
        onKeyDown={handleSkipToNav}
        className="hover:underline focus:underline"
      >
        Skip to navigation
      </a>
    </div>
  )
}
