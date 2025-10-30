import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSSE } from './useSSE'

// Mock EventSource
const mockEventSource = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  readyState: 1,
  url: 'http://localhost:8015/api/console',
}

global.EventSource = vi.fn(() => mockEventSource)

describe('useSSE Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    expect(result.current.isConnected).toBe(false)
    expect(result.current.messages).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should connect to SSE endpoint on mount', () => {
    renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    expect(EventSource).toHaveBeenCalledWith('http://localhost:8015/api/console')
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith('open', expect.any(Function))
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith('message', expect.any(Function))
    expect(mockEventSource.addEventListener).toHaveBeenCalledWith('error', expect.any(Function))
  })

  it('should handle connection open event', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    // Simulate connection open
    const openHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'open'
    )[1]
    
    act(() => {
      openHandler()
    })
    
    expect(result.current.isConnected).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('should handle incoming messages', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    // Simulate incoming message
    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1]
    
    const testMessage = {
      timestamp: '2024-01-01T00:00:00.000Z',
      message: 'Test console message',
      level: 'log'
    }
    
    act(() => {
      messageHandler({ data: JSON.stringify(testMessage) })
    })
    
    expect(result.current.messages).toHaveLength(1)
    expect(result.current.messages[0]).toEqual(testMessage)
  })

  it('should handle multiple messages', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1]
    
    const messages = [
      { timestamp: '2024-01-01T00:00:00.000Z', message: 'Message 1', level: 'log' },
      { timestamp: '2024-01-01T00:00:01.000Z', message: 'Message 2', level: 'error' },
      { timestamp: '2024-01-01T00:00:02.000Z', message: 'Message 3', level: 'info' }
    ]
    
    act(() => {
      messages.forEach(msg => {
        messageHandler({ data: JSON.stringify(msg) })
      })
    })
    
    expect(result.current.messages).toHaveLength(3)
    expect(result.current.messages).toEqual(messages)
  })

  it('should handle connection errors', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    const errorHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'error'
    )[1]
    
    act(() => {
      errorHandler(new Error('Connection failed'))
    })
    
    expect(result.current.isConnected).toBe(false)
    expect(result.current.error).toBe('Connection failed')
  })

  it('should close connection on unmount', () => {
    const { unmount } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    unmount()
    
    expect(mockEventSource.close).toHaveBeenCalled()
  })

  it('should handle malformed JSON messages gracefully', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console'))
    
    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1]
    
    act(() => {
      messageHandler({ data: 'invalid json' })
    })
    
    expect(result.current.messages).toHaveLength(0)
  })

  it('should limit message history to prevent memory issues', () => {
    const { result } = renderHook(() => useSSE('http://localhost:8015/api/console', { maxMessages: 3 }))
    
    const messageHandler = mockEventSource.addEventListener.mock.calls.find(
      call => call[0] === 'message'
    )[1]
    
    // Add 5 messages
    act(() => {
      for (let i = 0; i < 5; i++) {
        messageHandler({ 
          data: JSON.stringify({ 
            timestamp: `2024-01-01T00:00:0${i}.000Z`, 
            message: `Message ${i}`, 
            level: 'log' 
          }) 
        })
      }
    })
    
    expect(result.current.messages).toHaveLength(3)
    expect(result.current.messages[0].message).toBe('Message 2') // First 2 should be removed
    expect(result.current.messages[2].message).toBe('Message 4') // Last 3 should remain
  })
})
