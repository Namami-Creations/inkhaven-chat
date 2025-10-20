import EnhancedHomepage from '@/components/EnhancedHomepage'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function HomePage() {
  return (
    <ErrorBoundary>
      <EnhancedHomepage />
    </ErrorBoundary>
  )
}
