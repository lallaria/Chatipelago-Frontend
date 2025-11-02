import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { useConfig } from '../hooks/useConfig'

export const ConnectionStatus = () => {
  const { config } = useConfig()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const checkStatus = async () => {
    try {
      setLoading(true)
      setError(null)
      const statusData = await apiService.getStatus()
      setStatus(statusData)
    } catch (err) {
      setError(err.message)
      setStatus(null)
    } finally {
      setLoading(false)
    }
  }

  const handleArchipelagoConnect = async () => {
    try {
      setLoading(true)
      setError(null)
      await apiService.connectArchipelago()
      setTimeout(() => {
        checkStatus()
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleStreamerbotConnect = async () => {
    try {
      setLoading(true)
      setError(null)
      await apiService.connectStreamerbot()
      setTimeout(() => {
        checkStatus()
      }, 1000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [])

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

  const StatusBlock = ({ title, connected, uptime, url, onConnect, connectLabel, tooltipExtra, version, wider }) => {
    const statusColor = loading 
      ? 'bg-warning animate-pulse'
      : connected 
      ? 'bg-success' 
      : 'bg-error'
    
    const statusText = loading 
      ? 'Checking...'
      : connected 
      ? 'Connected' 
      : 'Disconnected'
    
    const tooltipText = [
      `Uptime: ${formatUptime(uptime)}`,
      url && `URL: ${url}`,
      tooltipExtra
    ].filter(Boolean).join('\n')

    return (
      <div className={`card bg-base-100 shadow-sm p-3 ${wider ? 'flex-[1.5] min-w-[280px]' : 'flex-1'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            <div className={`w-3 h-3 rounded-full ${statusColor} flex-shrink-0`}></div>
            <span className={`font-medium ${connected ? 'text-success' : 'text-error'} whitespace-nowrap`}>
              {title}: {statusText}
              {version && <span className="text-xs opacity-70 ml-1">v{version}</span>}
            </span>
          </div>
          {!connected && !loading && onConnect && (
            <button
              onClick={onConnect}
              disabled={loading}
              className="btn btn-primary btn-xs flex-shrink-0 ml-2"
            >
              {connectLabel || 'Connect'}
            </button>
          )}
        </div>
        <div 
          className="text-xs text-base-content/60 mt-1 tooltip tooltip-top whitespace-pre-line max-w-full" 
          data-tip={tooltipText}
        >
          <div className="flex items-start gap-2">
            <span className="whitespace-nowrap">Uptime: {formatUptime(uptime)}</span>
            {url && (
              <span className="truncate min-w-0">
                <span className="whitespace-nowrap">URL: </span>
                <span className="break-all">{url}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <div className="text-xs text-error">
          {error}
        </div>
      )}
      
      <StatusBlock
        title="API"
        connected={status?.api?.connected}
        uptime={status?.api?.uptime}
        version={status?.version}
        tooltipExtra={status?.version && `Version: ${status.version}`}
      />
      
      <StatusBlock
        title={status?.chatbot?.type === 'streamerbot' ? 'Streamer.bot' : status?.chatbot?.type === 'mixitup' ? 'MixItUp' : 'ChatBot'}
        connected={status?.chatbot?.connected}
        uptime={status?.chatbot?.uptime}
        tooltipExtra={status?.chatbot?.type === 'mixitup' && status?.chatbot?.port ? `Port: ${status.chatbot.port}` : null}
        onConnect={status?.chatbot?.type === 'streamerbot' && !status?.chatbot?.connected ? handleStreamerbotConnect : null}
        connectLabel="Connect"
      />
      
      <StatusBlock
        title="Archipelago"
        connected={status?.archipelago?.connected}
        uptime={status?.archipelago?.uptime}
        url={status?.archipelago?.url}
        onConnect={!status?.archipelago?.connected ? handleArchipelagoConnect : null}
        connectLabel="Connect"
        wider={true}
      />
    </div>
  )
}
