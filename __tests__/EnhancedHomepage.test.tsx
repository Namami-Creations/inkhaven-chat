/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EnhancedHomepage from '@/components/EnhancedHomepage'

// Mock Next.js navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

describe('EnhancedHomepage', () => {
  it('renders the main heading', () => {
    render(<EnhancedHomepage />)
    expect(screen.getByText(/Inkhaven Chat/i)).toBeInTheDocument()
  })

  it('shows pricing modal when upgrade button is clicked', async () => {
    const user = userEvent.setup()
    render(<EnhancedHomepage />)

    const upgradeButton = screen.getByText(/upgrade/i)
    await user.click(upgradeButton)

    expect(screen.getByText(/pricing/i)).toBeInTheDocument()
  })

  it('starts anonymous chat when anonymous button is clicked', async () => {
    const user = userEvent.setup()
    render(<EnhancedHomepage />)

    const anonymousButton = screen.getByText(/start chatting/i)
    await user.click(anonymousButton)

    expect(mockPush).toHaveBeenCalledWith('/chat')
  })

  it('navigates to register page when register button is clicked', async () => {
    const user = userEvent.setup()
    render(<EnhancedHomepage />)

    const registerButton = screen.getByText(/register/i)
    await user.click(registerButton)

    expect(mockPush).toHaveBeenCalledWith('/register')
  })
})
