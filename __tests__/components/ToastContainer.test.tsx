import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useToastStore } from '@/lib/toast'
import ToastContainer from '@/components/ToastContainer'

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

describe('Toast System', () => {
  beforeEach(() => {
    // Clear all toasts before each test
    const { clearToasts } = useToastStore.getState()
    clearToasts()
  })

  it('renders toast container without crashing', () => {
    render(<ToastContainer />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('displays success toast', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'success',
      title: 'Success!',
      message: 'Operation completed successfully',
    })

    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument()
      expect(screen.getByText('Operation completed successfully')).toBeInTheDocument()
    })
  })

  it('displays error toast', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'error',
      title: 'Error!',
      message: 'Something went wrong',
    })

    await waitFor(() => {
      expect(screen.getByText('Error!')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  it('displays warning toast', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'warning',
      title: 'Warning!',
      message: 'Please be careful',
    })

    await waitFor(() => {
      expect(screen.getByText('Warning!')).toBeInTheDocument()
      expect(screen.getByText('Please be careful')).toBeInTheDocument()
    })
  })

  it('displays info toast', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'info',
      title: 'Info',
      message: 'Here is some information',
    })

    await waitFor(() => {
      expect(screen.getByText('Info')).toBeInTheDocument()
      expect(screen.getByText('Here is some information')).toBeInTheDocument()
    })
  })

  it('auto-dismisses toast after duration', async () => {
    jest.useFakeTimers()

    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'success',
      title: 'Auto-dismiss test',
      duration: 1000, // 1 second
    })

    await waitFor(() => {
      expect(screen.getByText('Auto-dismiss test')).toBeInTheDocument()
    })

    // Fast-forward time
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.queryByText('Auto-dismiss test')).not.toBeInTheDocument()
    })

    jest.useRealTimers()
  })

  it('dismisses toast when close button is clicked', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'success',
      title: 'Dismiss test',
      duration: 0, // Don't auto-dismiss
    })

    await waitFor(() => {
      expect(screen.getByText('Dismiss test')).toBeInTheDocument()
    })

    const closeButton = screen.getByLabelText('Dismiss notification')
    fireEvent.click(closeButton)

    await waitFor(() => {
      expect(screen.queryByText('Dismiss test')).not.toBeInTheDocument()
    })
  })

  it('renders toast with action button', async () => {
    const mockAction = jest.fn()
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'success',
      title: 'Action test',
      message: 'Click the action',
      action: {
        label: 'Retry',
        onClick: mockAction,
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Retry')).toBeInTheDocument()
    })

    const actionButton = screen.getByText('Retry')
    fireEvent.click(actionButton)

    expect(mockAction).toHaveBeenCalled()
  })

  it('renders multiple toasts', async () => {
    const { addToast } = useToastStore.getState()

    render(<ToastContainer />)

    addToast({
      type: 'success',
      title: 'First toast',
    })

    addToast({
      type: 'error',
      title: 'Second toast',
    })

    await waitFor(() => {
      expect(screen.getByText('First toast')).toBeInTheDocument()
      expect(screen.getByText('Second toast')).toBeInTheDocument()
    })
  })
})
