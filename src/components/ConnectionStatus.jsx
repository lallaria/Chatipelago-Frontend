import { useState, useEffect } from 'react'
import { apiService } from '../services/api'

export const ConnectionStatus = () => {
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastChecked, setLastChecked] = useState(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const statusData = await apiService.getStatus()
      setStatus(statusData)
      setLastChecked(new Date())
    } catch (err) {
      setError(err.message)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleReconnect = async () => {
    await checkStatus()
  }

  useEffect(() => {
    checkStatus()
    
    // Check status every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (loading) return 'text-yellow-500'
    if (error || !status) return 'text-red-500'
    if (status?.status === 'connected') return 'text-green-500'
    return 'text-gray-500'
  }

  const getStatusText = () => {
    if (loading) return 'Checking...'
    if (error || !status) return 'Disconnected'
    return status.status === 'connected' ? 'Connected' : 'Unknown'
  }

  const formatUptime = (seconds) => {
    if (!seconds) return 'N/A'
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const formatLastChecked = () => {
    if (!lastChecked) return 'Never'
    return lastChecked.toLocaleTimeString()
  }

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            loading ? 'bg-yellow-500 animate-pulse' :
            error || !status ? 'bg-red-500' :
            status?.status === 'connected' ? 'bg-green-500' : 'bg-gray-500'
          }`}></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {status?.version && (
                <span className="text-xs text-gray-500">
                  v{status.version}
                </span>
              )}
            </div>
            {error && (
              <div className="text-xs text-red-600 mt-1">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {status && (
            <div className="text-sm text-gray-600">
              <div>Uptime: {formatUptime(status.uptime)}</div>
              <div>Last checked: {formatLastChecked()}</div>
            </div>
          )}
          
          <button
            onClick={handleReconnect}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Reconnect'}
          </button>
        </div>
      </div>
    </div>
  )
}
