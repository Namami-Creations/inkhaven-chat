import ChatApp from '@/components/ChatApp'
import ErrorBoundary from '@/components/ErrorBoundary'

export default function ChatPage() {
  return (
    <ErrorBoundary>
      <ChatApp />
    </ErrorBoundary>
  )
}
