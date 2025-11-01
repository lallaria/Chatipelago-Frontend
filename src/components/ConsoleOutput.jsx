import { useState, useMemo, useRef, useEffect } from 'react'
import { useSSE } from '../hooks/useSSE'

export const ConsoleOutput = () => {
  const { isConnected, messages, error, clearMessages } = useSSE('http://localhost:8015/api/console')
  const [filter, setFilter] = useState('info')
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
        return 'text-error'
      case 'warn':
        return 'text-warning'
      case 'info':
        return 'text-info'
      case 'log':
        return 'text-success'
      case 'debug':
        return 'text-base-content/60'
      default:
        return 'text-base-content'
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
        <h2 className="text-2xl font-bold mb-2">Console Output</h2>
        <p className="text-base-content/70">Real-time console logs from Chatipelago client</p>
      </div>

      {/* Status and Controls */}
      <div className="card bg-base-100 shadow-sm p-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                isConnected ? 'bg-success' : 'bg-error'
              }`}></div>
              <span className="text-sm font-medium">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            {error && (
              <span className="text-sm text-error">Error: {error}</span>
            )}
            <span className="text-sm text-base-content/60">
              {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                aria-label="Filter messages by level"
                className="select select-sm select-bordered"
              >
                <option value="all">All</option>
                <option value="debug">Debug</option>
                <option value="log">Log</option>
                <option value="info">Info</option>
                <option value="warn">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>

            <div className="form-control">
              <label className="label cursor-pointer gap-2">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text text-sm">Auto-scroll</span>
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={clearMessages}
                className="btn btn-sm btn-neutral"
              >
                Clear Console
              </button>
              <button
                onClick={exportLogs}
                className="btn btn-sm btn-primary"
              >
                Export Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="bg-terminal-bg text-success rounded-lg shadow-lg overflow-hidden">
        <div className="bg-base-300 px-4 py-2 border-b border-base-300">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-error rounded-full"></div>
            <div className="w-3 h-3 bg-warning rounded-full"></div>
            <div className="w-3 h-3 bg-success rounded-full"></div>
            <span className="ml-4 text-sm font-mono">Chatipelago Console</span>
          </div>
        </div>
        
        <div
          ref={consoleRef}
          className="h-96 overflow-y-auto p-4 font-mono text-sm terminal-scrollbar"
        >
          {filteredMessages.length === 0 ? (
            <div className="text-base-content/50 italic">
              {messages.length === 0 ? 'No messages to display' : 'No messages match the current filter'}
            </div>
          ) : (
            filteredMessages.map((message, index) => (
              <div key={index} className="mb-1 flex items-start space-x-2">
                <span className="text-base-content/50 text-xs flex-shrink-0">
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
