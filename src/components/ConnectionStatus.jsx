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
    if (loading) return 'text-warning'
    if (error || !status) return 'text-error'
    if (status?.status === 'connected') return 'text-success'
    return 'text-base-content/50'
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
    <div className="card bg-base-100 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${
            loading ? 'bg-warning animate-pulse' :
            error || !status ? 'bg-error' :
            status?.status === 'connected' ? 'bg-success' : 'bg-base-300'
          }`}></div>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
              {status?.version && (
                <span className="text-xs text-base-content/60">
                  v{status.version}
                </span>
              )}
            </div>
            {error && (
              <div className="text-xs text-error mt-1">
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {status && (
            <div className="text-sm text-base-content/70">
              <div>Uptime: {formatUptime(status.uptime)}</div>
              <div>Last checked: {formatLastChecked()}</div>
            </div>
          )}
          
          <button
            onClick={handleReconnect}
            disabled={loading}
            className="btn btn-primary btn-sm"
          >
            {loading ? 'Checking...' : 'Reconnect'}
          </button>
        </div>
      </div>
    </div>
  )
}
