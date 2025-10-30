import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsoleOutput } from './ConsoleOutput'

// Mock the useSSE hook
vi.mock('../hooks/useSSE', () => ({
  useSSE: vi.fn()
}))

const mockMessages = [
  {
    timestamp: '2024-01-01T00:00:00.000Z',
    message: 'Chatipelago client started',
    level: 'log'
  },
  {
    timestamp: '2024-01-01T00:00:01.000Z',
    message: 'Connected to Archipelago server',
    level: 'info'
  },
  {
    timestamp: '2024-01-01T00:00:02.000Z',
    message: 'Error: Connection failed',
    level: 'error'
  },
  {
    timestamp: '2024-01-01T00:00:03.000Z',
    message: 'Command executed: /help',
    level: 'log'
  }
]

describe('ConsoleOutput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render console output with terminal styling', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('Console Output')).toBeInTheDocument()
    expect(screen.getByLabelText('Filter messages by level')).toBeInTheDocument()
  })

  it('should display all messages by default', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('Chatipelago client started')).toBeInTheDocument()
    expect(screen.getByText('Connected to Archipelago server')).toBeInTheDocument()
    expect(screen.getByText('Error: Connection failed')).toBeInTheDocument()
    expect(screen.getByText('Command executed: /help')).toBeInTheDocument()
  })

  it('should filter messages by level', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    const filterSelect = screen.getByLabelText('Filter messages by level')
    await userEvent.selectOptions(filterSelect, 'error')
    
    expect(screen.getByText('Error: Connection failed')).toBeInTheDocument()
    expect(screen.queryByText('Chatipelago client started')).not.toBeInTheDocument()
    expect(screen.queryByText('Connected to Archipelago server')).not.toBeInTheDocument()
    expect(screen.queryByText('Command executed: /help')).not.toBeInTheDocument()
  })


  it('should display connection status', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: [],
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('Connected')).toBeInTheDocument()
  })

  it('should display connection error', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: false,
      messages: [],
      error: 'Connection failed'
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('Disconnected')).toBeInTheDocument()
    expect(screen.getByText('Error: Connection failed')).toBeInTheDocument()
  })

  it('should clear console when clear button is clicked', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    const mockClearMessages = vi.fn()
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null,
      clearMessages: mockClearMessages
    })

    render(<ConsoleOutput />)
    
    const clearButton = screen.getByText('Clear Console')
    await userEvent.click(clearButton)
    
    expect(mockClearMessages).toHaveBeenCalled()
  })

  it('should have export logs button', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('Export Logs')).toBeInTheDocument()
  })

  it('should toggle auto-scroll', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    const autoScrollCheckbox = screen.getByLabelText('Auto-scroll to latest')
    expect(autoScrollCheckbox).toBeChecked()
    
    await userEvent.click(autoScrollCheckbox)
    expect(autoScrollCheckbox).not.toBeChecked()
  })

  it('should display timestamps for messages', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    // Check that timestamps are displayed (they will be in local time format)
    expect(screen.getByText('7:00:00 PM')).toBeInTheDocument()
    expect(screen.getByText('7:00:01 PM')).toBeInTheDocument()
    expect(screen.getByText('7:00:02 PM')).toBeInTheDocument()
    expect(screen.getByText('7:00:03 PM')).toBeInTheDocument()
  })


  it('should show message count', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: mockMessages,
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('4 messages')).toBeInTheDocument()
  })

  it('should handle empty message list', async () => {
    const { useSSE } = await import('../hooks/useSSE')
    useSSE.mockReturnValue({
      isConnected: true,
      messages: [],
      error: null
    })

    render(<ConsoleOutput />)
    
    expect(screen.getByText('No messages to display')).toBeInTheDocument()
    expect(screen.getByText('0 messages')).toBeInTheDocument()
  })
})