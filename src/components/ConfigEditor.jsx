import { useState, useEffect } from 'react'
import { useConfig } from '../hooks/useConfig'
import { validateConfig } from '../utils/validation'
import ReactMarkdown from 'react-markdown'
import { useMemo } from 'react'

export const ConfigEditor = () => {
  const { config, loading, error, saving, saveConfig, updateConfig, resetConfig } = useConfig()
  const [localConfig, setLocalConfig] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})
  const [saveMessage, setSaveMessage] = useState('')
  const [hasChanges, setHasChanges] = useState(false)
  const [actionsText, setActionsText] = useState('')
  const [actionsTextError, setActionsTextError] = useState('')
  const [mixitupReadme, setMixitupReadme] = useState('')
  const [mixitupReadmeErr, setMixitupReadmeErr] = useState('')

  useEffect(() => {
    if (config) {
      setLocalConfig({ ...config })
      setHasChanges(false)
    }
  }, [config])

  // Fetch Streamer.bot actions text when Streamer.bot integration is enabled
  useEffect(() => {
    const fetchActionsText = async () => {
      try {
        setActionsTextError('')
        const res = await fetch('/api/streamerbot/actions-text', { credentials: 'include' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setActionsText(data?.text || '')
      } catch (e) {
        setActionsText('')
        setActionsTextError('Failed to load Streamer.bot actions text')
      }
    }

    if (localConfig?.streamerbot) {
      fetchActionsText()
    } else {
      setActionsText('')
      setActionsTextError('')
    }
  }, [localConfig?.streamerbot])

  // Fetch and cache MixItUp README (markdown)
  useEffect(() => {
    if (!localConfig?.mixitup) return
    setMixitupReadmeErr('')
    fetch('/mixitup_files/README.md').then(async r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      setMixitupReadme(await r.text())
    }).catch(() => setMixitupReadmeErr('Could not load MixItUp instructions'))
  }, [localConfig?.mixitup])

  const handleInputChange = (section, field, value) => {
    setLocalConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setHasChanges(true)
    setSaveMessage('')
  }

  const handleArrayChange = (section, field, value) => {
    const arrayValue = value.split(',').map(item => item.trim()).filter(item => item)
    handleInputChange(section, field, arrayValue)
  }

  const handleIntegrationToggle = (integration) => {
    setLocalConfig(prev => ({
      ...prev,
      mixitup: integration === 'mixitup',
      streamerbot: integration === 'streamerbot'
    }))
    setHasChanges(true)
    setSaveMessage('')
  }

  const handleSave = async () => {
    if (!localConfig) return

    const validation = validateConfig(localConfig)
    setValidationErrors(validation.errors)

    if (!validation.isValid) {
      setSaveMessage('Please fix validation errors before saving')
      return
    }

    try {
      await saveConfig(localConfig)
      setSaveMessage('Configuration saved successfully')
      setHasChanges(false)
    } catch (err) {
      setSaveMessage(`Failed to save configuration: ${err.message}`)
    }
  }

  const handleCancel = () => {
    if (config) {
      setLocalConfig({ ...config })
    }
    setValidationErrors({})
    setSaveMessage('')
    setHasChanges(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading configuration...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading configuration: {error}
      </div>
    )
  }

  if (!localConfig) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configuration Management</h2>
        <p className="text-gray-600">Manage your Chatipelago client settings</p>
      </div>

      {hasChanges && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          You have unsaved changes
        </div>
      )}

      {saveMessage && (
        <div className={`px-4 py-3 rounded mb-4 ${
          saveMessage.includes('successfully') 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Integration Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Integration Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="integration"
                  checked={localConfig.mixitup}
                  onChange={() => handleIntegrationToggle('mixitup')}
                  className="mr-2"
                />
                Enable Mixitup Integration
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="integration"
                  checked={localConfig.streamerbot}
                  onChange={() => handleIntegrationToggle('streamerbot')}
                  className="mr-2"
                />
                Enable Streamer.bot Integration
              </label>
            </div>

            {localConfig.streamerbot && (
              <div className="mt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Streamer.bot Import String
                </label>
                <div className="flex items-start gap-2">
                  <textarea
                    readOnly
                    value={actionsText}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(actionsText || '')
                      } catch {}
                    }}
                    className="shrink-0 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                    disabled={!actionsText}
                  >
                    Copy
                  </button>
                </div>
                {actionsTextError && (
                  <p className="text-red-500 text-sm mt-1">{actionsTextError}</p>
                )}
              </div>
            )}
            
            {localConfig.mixitup && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Webhook URL
                </label>
                <input
                  type="url"
                  value={localConfig.webhookUrl || ''}
                  onChange={(e) => handleInputChange('', 'webhookUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://mixitup.webhook/"
                />
                {validationErrors.webhookUrl && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.webhookUrl}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MixItUp Import Instructions & Download */}
        {localConfig.mixitup && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">MixItUp Import Instructions & Files</h3>
            <a
              href="/mixitup_files/mixitup_files.zip"
              download
              className="block w-fit mb-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-5 rounded transition"
            >
              Download MixItUp Files (zip)
            </a>
            {mixitupReadmeErr ? (
              <div className="text-red-500 text-sm">{mixitupReadmeErr}</div>
            ) : (
              <div className="prose max-w-none">
                <ReactMarkdown
                  children={mixitupReadme}
                  components={{
                    img: ({node, ...props}) => (
                      <img {...props} style={{maxWidth:'100%',border:'1px solid #ccc',borderRadius:'6px'}} />
                    )
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Connection Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connection Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hostname *
              </label>
              <input
                type="text"
                value={localConfig.connectionInfo?.hostname || ''}
                onChange={(e) => handleInputChange('connectionInfo', 'hostname', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="archipelago.gg"
              />
              {validationErrors.connectionInfo?.hostname && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.connectionInfo.hostname}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Port *
              </label>
              <input
                type="number"
                value={localConfig.connectionInfo?.port || ''}
                onChange={(e) => handleInputChange('connectionInfo', 'port', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="38281"
                min="1"
                max="65535"
              />
              {validationErrors.connectionInfo?.port && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.connectionInfo.port}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Player Name *
              </label>
              <input
                type="text"
                value={localConfig.connectionInfo?.playerName || ''}
                onChange={(e) => handleInputChange('connectionInfo', 'playerName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Chat"
              />
              {validationErrors.connectionInfo?.playerName && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.connectionInfo.playerName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={localConfig.connectionInfo?.tags?.join(', ') || ''}
                onChange={(e) => handleArrayChange('connectionInfo', 'tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="AP, DeathLink"
              />
            </div>
          </div>
        </div>

        {/* Streamer.bot Config */}
            {localConfig.streamerbot && (
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Streamer.bot Config</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Host *
                    </label>
                    <input
                      type="text"
                      value={localConfig.streamerbotConfig?.host || ''}
                      onChange={(e) => handleInputChange('streamerbotConfig', 'host', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="localhost"
                    />
                    {validationErrors.streamerbotConfig?.host && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.streamerbotConfig.host}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Port *
                    </label>
                    <input
                      type="number"
                      value={localConfig.streamerbotConfig?.port || ''}
                      onChange={(e) => handleInputChange('streamerbotConfig', 'port', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="8014"
                      min="1"
                      max="65535"
                    />
                    {validationErrors.streamerbotConfig?.port && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.streamerbotConfig.port}</p>
                    )}
                  </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Endpoint
                </label>
                <input
                  type="text"
                  value={localConfig.streamerbotConfig?.endpoint || ''}
                  onChange={(e) => handleInputChange('streamerbotConfig', 'endpoint', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="/chati"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <input
                  type="password"
                  value={localConfig.streamerbotConfig?.password || ''}
                  onChange={(e) => handleInputChange('streamerbotConfig', 'password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="delilahsbasement"
                />
                {validationErrors.streamerbotConfig?.password && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.streamerbotConfig.password}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Retries
                </label>
                <input
                  type="number"
                  value={localConfig.streamerbotConfig?.retries || ''}
                  onChange={(e) => handleInputChange('streamerbotConfig', 'retries', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5"
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.streamerbotConfig?.immediate || false}
                    onChange={(e) => handleInputChange('streamerbotConfig', 'immediate', e.target.checked)}
                    className="mr-2"
                  />
                  Connect Immediately
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localConfig.streamerbotConfig?.autoReconnect || false}
                    onChange={(e) => handleInputChange('streamerbotConfig', 'autoReconnect', e.target.checked)}
                    className="mr-2"
                  />
                  Auto Reconnect
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Streamer.bot Actions */}
        {localConfig.streamerbot && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Streamer.bot Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trap Message Action ID
                </label>
                <input
                  type="text"
                  value={localConfig.streamerbotActions?.trapMessage || ''}
                  onChange={(e) => handleInputChange('streamerbotActions', 'trapMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="929a40f0-eb5f-44a8-a94a-368e144fbde2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bounced Message Action ID
                </label>
                <input
                  type="text"
                  value={localConfig.streamerbotActions?.bouncedMessage || ''}
                  onChange={(e) => handleInputChange('streamerbotActions', 'bouncedMessage', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="185e6b60-3bd0-4a93-8644-3832ef7ca890"
                />
              </div>
            </div>
          </div>
        )}

        {/* Game Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Attempts Required
              </label>
              <input
                type="number"
                value={localConfig.gameSettings?.searchAttemptsRequired || ''}
                onChange={(e) => handleInputChange('gameSettings', 'searchAttemptsRequired', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
                min="1"
              />
              {validationErrors.gameSettings?.searchAttemptsRequired && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.gameSettings.searchAttemptsRequired}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loot Attempts Required
              </label>
              <input
                type="number"
                value={localConfig.gameSettings?.lootAttemptsRequired || ''}
                onChange={(e) => handleInputChange('gameSettings', 'lootAttemptsRequired', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
                min="1"
              />
              {validationErrors.gameSettings?.lootAttemptsRequired && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.gameSettings.lootAttemptsRequired}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loot Chance (0-1)
              </label>
              <input
                type="number"
                step="0.1"
                value={localConfig.gameSettings?.lootChance || ''}
                onChange={(e) => handleInputChange('gameSettings', 'lootChance', parseFloat(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.7"
                min="0"
                max="1"
              />
              {validationErrors.gameSettings?.lootChance && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.gameSettings.lootChance}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Cooldown (seconds)
              </label>
              <input
                type="number"
                value={localConfig.gameSettings?.checkCooldown || ''}
                onChange={(e) => handleInputChange('gameSettings', 'checkCooldown', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="240"
                min="0"
              />
              {validationErrors.gameSettings?.checkCooldown && (
                <p className="text-red-500 text-sm mt-1">{validationErrors.gameSettings.checkCooldown}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={handleCancel}
          disabled={!hasChanges}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel Changes
        </button>
        <button
          onClick={handleSave}
          disabled={saving || !hasChanges}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}
