import { useState, useEffect, useCallback } from 'react'
import { apiService } from '../services/api'

export const useConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const configData = await apiService.getConfig()
      setConfig(configData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const saveConfig = useCallback(async (configData) => {
    try {
      setSaving(true)
      setError(null)
      const result = await apiService.updateConfig(configData)
      setConfig(configData)
      return result
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setSaving(false)
    }
  }, [])

  const updateConfig = useCallback((updates) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }))
  }, [])

  const resetConfig = useCallback(() => {
    loadConfig()
  }, [loadConfig])

  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    loading,
    error,
    saving,
    loadConfig,
    saveConfig,
    updateConfig,
    resetConfig,
  }
}
