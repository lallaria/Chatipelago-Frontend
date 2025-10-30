import { useState, useEffect, useRef, useCallback } from 'react'

export const useSSE = (url, options = {}) => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [error, setError] = useState(null)
  const eventSourceRef = useRef(null)
  const { maxMessages = 1000 } = options

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  const addMessage = useCallback((message) => {
    setMessages(prev => {
      const newMessages = [...prev, message]
      // Limit message history to prevent memory issues
      if (newMessages.length > maxMessages) {
        return newMessages.slice(-maxMessages)
      }
      return newMessages
    })
  }, [maxMessages])

  useEffect(() => {
    if (!url) return

    const eventSource = new EventSource(url)
    eventSourceRef.current = eventSource

    eventSource.addEventListener('open', () => {
      setIsConnected(true)
      setError(null)
    })

    eventSource.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data)
        addMessage(data)
      } catch (err) {
        console.error('Failed to parse SSE message:', err)
      }
    })

    eventSource.addEventListener('error', (event) => {
      setIsConnected(false)
      setError('Connection failed')
    })

    return () => {
      eventSource.close()
      eventSourceRef.current = null
    }
  }, [url, addMessage])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  return {
    isConnected,
    messages,
    error,
    clearMessages,
  }
}
