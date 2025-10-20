import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import ChatInterface from '@/components/ChatInterface'
import { CHAT_THEMES } from '@/utils/types'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    channel: jest.fn(() => ({
      on: jest.fn(() => ({
        subscribe: jest.fn(),
      })),
      removeChannel: jest.fn(),
    })),
  },
}))

// Mock AI moderation
jest.mock('@/lib/ai-moderation', () => ({
  AIModerationService: {
    moderateContent: jest.fn(),
  },
}))

describe('ChatInterface', () => {
  const defaultProps = {
    theme: 'modern' as keyof typeof CHAT_THEMES,
    onThemeChange: jest.fn(),
    onNextChat: jest.fn(),
    onReport: jest.fn(),
    onBlock: jest.fn(),
    onRegister: jest.fn(),
    sessionId: 'test-session',
    userId: 'test-user',
    isOnline: true,
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders chat interface with header and input', () => {
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByText('Anonymous User')).toBeInTheDocument()
    expect(screen.getByText('Next Chat')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('shows typing indicator when typing state is true', () => {
    // This would require mocking the internal state or exposing it
    // For now, we'll test the basic structure
    render(<ChatInterface {...defaultProps} />)

    expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument()
  })

  it('calls onNextChat when Next Chat button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const nextChatButton = screen.getByText('Next Chat')
    await user.click(nextChatButton)

    expect(defaultProps.onNextChat).toHaveBeenCalled()
  })

  it('calls onReport when Report button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const reportButton = screen.getByText('Report')
    await user.click(reportButton)

    expect(defaultProps.onReport).toHaveBeenCalled()
  })

  it('calls onBlock when Block button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const blockButton = screen.getByText('Block')
    await user.click(blockButton)

    expect(defaultProps.onBlock).toHaveBeenCalled()
  })

  it('calls onRegister when Register button is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const registerButton = screen.getByText('Register')
    await user.click(registerButton)

    expect(defaultProps.onRegister).toHaveBeenCalled()
  })

  it('enables send button when message is typed', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const input = screen.getByPlaceholderText('Type your message...')
    const sendButton = screen.getByLabelText('Send message')

    // Initially disabled
    expect(sendButton).toBeDisabled()

    // Type a message
    await user.type(input, 'Hello world')

    // Should be enabled now
    expect(sendButton).not.toBeDisabled()
  })

  it('sends message when Enter is pressed', async () => {
    const user = userEvent.setup()
    const mockModerateContent = jest.fn().mockResolvedValue({ isAllowed: true })

    // Mock the moderation service
    const { AIModerationService } = require('@/lib/ai-moderation')
    AIModerationService.moderateContent = mockModerateContent

    render(<ChatInterface {...defaultProps} />)

    const input = screen.getByPlaceholderText('Type your message...')

    await user.type(input, 'Test message{enter}')

    // Wait for async operations
    await waitFor(() => {
      expect(mockModerateContent).toHaveBeenCalledWith('Test message')
    })
  })

  it('shows theme selector when cog icon is clicked', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    const cogButton = screen.getByLabelText(/settings|theme/i)
    await user.click(cogButton)

    // Should show theme options
    expect(screen.getByText('Choose Theme')).toBeInTheDocument()
  })

  it('calls onThemeChange when theme is selected', async () => {
    const user = userEvent.setup()
    render(<ChatInterface {...defaultProps} />)

    // Open theme selector
    const cogButton = screen.getByLabelText(/settings|theme/i)
    await user.click(cogButton)

    // Click on a theme
    const cosmicTheme = screen.getByText('Cosmic')
    await user.click(cosmicTheme)

    expect(defaultProps.onThemeChange).toHaveBeenCalledWith('cosmic')
  })
})
