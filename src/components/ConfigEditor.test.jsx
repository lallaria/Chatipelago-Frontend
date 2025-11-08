import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConfigEditor } from './ConfigEditor'

// Mock the API service
const mockApiService = {
  getConfig: vi.fn(),
  updateConfig: vi.fn(),
  restartClient: vi.fn()
}

vi.mock('../services/api', () => ({
  apiService: mockApiService
}))

// Mock the useConfig hook
const mockUseConfig = {
  config: null,
  loading: false,
  error: null,
  saving: false,
  saveConfig: vi.fn(),
  updateConfig: vi.fn(),
  resetConfig: vi.fn()
}

vi.mock('../hooks/useConfig', () => ({
  useConfig: () => mockUseConfig
}))

const mockConfig = {
  mixitup: false,
  streamerbot: true,
  connectionInfo: {
    hostname: 'archipelago.gg',
    port: 38281,
    playerName: 'Chat',
    password: '',
    tags: ['AP', 'DeathLink']
  },
  webhookUrl: 'https://mixitup.webhook/',
  streamerbotConfig: {
    port: 8014,
    endpoint: '/chati',
    password: 'delilahsbasement',
    autoConnect: true,
    reconnect: true
  },
  streamerbotActions: {
    trapMessage: '929a40f0-eb5f-44a8-a94a-368e144fbde2',
    bouncedMessage: '185e6b60-3bd0-4a93-8644-3832ef7ca890'
  },
  gameSettings: {
    searchAttemptsRequired: 5,
    lootAttemptsRequired: 5,
    lootChance: 0.7,
    checkCooldown: 240
  }
}

describe('ConfigEditor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseConfig.config = mockConfig
    mockUseConfig.loading = false
    mockUseConfig.error = null
    mockUseConfig.saving = false
    mockUseConfig.saveConfig.mockReset()
    mockUseConfig.saveConfig.mockResolvedValue({ success: true })
  })

  it('should render configuration form with all sections', () => {
    render(<ConfigEditor />)
    
    expect(screen.getByText('Configuration Management')).toBeInTheDocument()
    expect(screen.getByText('Integration Settings')).toBeInTheDocument()
    expect(screen.getByText('Archipelago Connection Info')).toBeInTheDocument()
    expect(screen.getByText('Streamer.bot Config')).toBeInTheDocument()
    expect(screen.getByText('Streamer.bot Actions')).toBeInTheDocument()
    expect(screen.getByText('Game Settings')).toBeInTheDocument()
  })

  it('should display loaded configuration values', () => {
    render(<ConfigEditor />)
    
    expect(screen.getByDisplayValue('archipelago.gg')).toBeInTheDocument()
    expect(screen.getByDisplayValue('38281')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Chat')).toBeInTheDocument()
  })

  it('should handle form input changes', async () => {
    render(<ConfigEditor />)
    
    const hostnameInput = screen.getByDisplayValue('archipelago.gg')
    await userEvent.clear(hostnameInput)
    await userEvent.type(hostnameInput, 'new.host.com')

    expect(hostnameInput.value).toBe('new.host.com')
  })

  it('should validate required fields', async () => {
    render(<ConfigEditor />)
    
    const playerNameInput = screen.getByDisplayValue('Chat')
    await userEvent.clear(playerNameInput)

    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Player name is required')).toBeInTheDocument()
    })
  })

  it('should validate port numbers', async () => {
    render(<ConfigEditor />)
    
    const portInput = screen.getByDisplayValue('38281')
    await userEvent.clear(portInput)
    await userEvent.type(portInput, '99999')

    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Port must be between 1 and 65535')).toBeInTheDocument()
    })
  })

  it('should validate probability values', async () => {
    render(<ConfigEditor />)
    
    const lootChanceInput = screen.getByDisplayValue('0.7')
    await userEvent.clear(lootChanceInput)
    await userEvent.type(lootChanceInput, '1.5')

    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Loot chance must be between 0 and 1')).toBeInTheDocument()
    })
  })

  it('should save configuration successfully', async () => {
    mockUseConfig.saveConfig.mockResolvedValue({ success: true, message: 'Configuration updated' })
    
    render(<ConfigEditor />)
    
    // First make a change to enable the save button
    const hostnameInput = screen.getByDisplayValue('archipelago.gg')
    await userEvent.clear(hostnameInput)
    await userEvent.type(hostnameInput, 'new.host.com')
    
    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUseConfig.saveConfig).toHaveBeenCalled()
      expect(screen.getByText('Configuration saved successfully')).toBeInTheDocument()
    })
  })

  it('should handle save errors', async () => {
    mockUseConfig.saveConfig.mockRejectedValue(new Error('Save failed'))
    
    render(<ConfigEditor />)
    
    // First make a change to enable the save button
    const hostnameInput = screen.getByDisplayValue('archipelago.gg')
    await userEvent.clear(hostnameInput)
    await userEvent.type(hostnameInput, 'new.host.com')
    
    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText('Failed to save configuration: Save failed')).toBeInTheDocument()
    })
  })

  it('should allow empty passwords for optional fields', async () => {
    render(<ConfigEditor />)

    const streamerbotPasswordInput = screen.getByLabelText(/Streamer\.bot Password/i)
    await userEvent.clear(streamerbotPasswordInput)

    const archipelagoPasswordInput = screen.getByLabelText(/Archipelago Password/i)
    await userEvent.clear(archipelagoPasswordInput)

    const saveButton = screen.getByText('Save Configuration')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUseConfig.saveConfig).toHaveBeenCalled()
    })

    expect(screen.queryByText('Password is required for Streamer.bot')).not.toBeInTheDocument()
  })

  it('should reset form to original values on cancel', async () => {
    render(<ConfigEditor />)
    
    const hostnameInput = screen.getByDisplayValue('archipelago.gg')
    await userEvent.clear(hostnameInput)
    await userEvent.type(hostnameInput, 'modified.host.com')

    const cancelButton = screen.getByText('Cancel Changes')
    await userEvent.click(cancelButton)

    await waitFor(() => {
      expect(hostnameInput.value).toBe('archipelago.gg')
    })
  })

  it('should show pending changes indicator', async () => {
    render(<ConfigEditor />)
    
    const hostnameInput = screen.getByDisplayValue('archipelago.gg')
    await userEvent.clear(hostnameInput)
    await userEvent.type(hostnameInput, 'modified.host.com')

    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
  })

  it('should toggle integration modes correctly', async () => {
    render(<ConfigEditor />)
    
    const mixitupCheckbox = screen.getByLabelText('Enable Mixitup Integration')
    const streamerbotCheckbox = screen.getByLabelText('Enable Streamer.bot Integration')

    expect(streamerbotCheckbox).toBeChecked()
    expect(mixitupCheckbox).not.toBeChecked()

    // Enable mixitup should disable streamerbot
    await userEvent.click(mixitupCheckbox)
    expect(mixitupCheckbox).toBeChecked()
    expect(streamerbotCheckbox).not.toBeChecked()

    // Enable streamerbot should disable mixitup
    await userEvent.click(streamerbotCheckbox)
    expect(streamerbotCheckbox).toBeChecked()
    expect(mixitupCheckbox).not.toBeChecked()
  })

  it('should show loading state', () => {
    mockUseConfig.loading = true
    mockUseConfig.config = null
    
    render(<ConfigEditor />)
    
    expect(screen.getByText('Loading configuration...')).toBeInTheDocument()
  })

  it('should show error state', () => {
    mockUseConfig.error = 'Failed to load configuration'
    mockUseConfig.config = null
    
    render(<ConfigEditor />)
    
    expect(screen.getByText('Error loading configuration: Failed to load configuration')).toBeInTheDocument()
  })

  it('should disable save button when saving', () => {
    mockUseConfig.saving = true
    
    render(<ConfigEditor />)
    
    const saveButton = screen.getByText('Saving...')
    expect(saveButton).toBeDisabled()
  })

  it('should disable save button when no changes', () => {
    render(<ConfigEditor />)
    
    const saveButton = screen.getByText('Save Configuration')
    expect(saveButton).toBeDisabled()
  })
})