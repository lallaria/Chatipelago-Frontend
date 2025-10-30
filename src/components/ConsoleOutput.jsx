import { useState, useMemo, useRef, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'

export const ConsoleOutput = () => {
  const { isConnected, messages, error, clearMessages } = useSSE('http://localhost:8015/api/console')
  const [filter, setFilter] = useState('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const consoleRef = useRef(null)

  const filteredMessages = useMemo(() => {
    let filtered = messages

    // Filter by level
    if (filter !== 'all') {
      filtered = filtered.filter(msg => msg.level === filter)
    }

    return filtered
  }, [messages, filter])

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const getLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-400'
      case 'warn':
        return 'text-yellow-400'
      case 'info':
        return 'text-blue-400'
      default:
        return 'text-green-400'
    }
  }

  const exportLogs = () => {
    const logContent = messages.map(msg => 
      `[${msg.timestamp}] [${msg.level.toUpperCase()}] ${msg.message}`
    ).join('\n')

    const blob = new Blob([logContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `chatipelago-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (autoScroll && consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight
    }
  }, [filteredMessages, autoScroll])

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Console Output</h2>
        <p className="text-gray-600">Real-time console logs from Chatipelago client</p>
      </div>

      {/* Status and Controls */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {error && (
              <span className="text-sm text-red-600">Error: {error}</span>
            )}
            <span className="text-sm text-gray-500">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter messages by level"
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="log">Log</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>


            <div className="flex items-center space-x-2">
              <label className="flex items-center text-sm">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="mr-1"
                />
                Auto-scroll to latest
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearMessages}
                className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600"
              >
                Clear Console
              </button>
              <button
                onClick={exportLogs}
                className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="bg-terminal-bg text-green-400 rounded-lg shadow-lg overflow-hidden">
        <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 text-sm font-mono">Chatipelago Console</span>
          </div>
        </div>
        
        <div
          ref={consoleRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm"
        >
          {filteredMessages.length === 0 ? (
            <div className="text-gray-500 italic">
              {messages.length === 0 ? 'No messages to display' : 'No messages match the current filter'}
            </div>
          ) : (
            filteredMessages.map((message, index) => (
              <div key={index} className="mb-1 flex items-start space-x-2">
                <span className="text-gray-500 text-xs flex-shrink-0">
                  {formatTimestamp(message.timestamp)}
                </span>
                <span className={`text-xs flex-shrink-0 ${getLevelColor(message.level)}`}>
                  [{message.level.toUpperCase()}]
                </span>
                <span className="flex-1">
                  {message.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
