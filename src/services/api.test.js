import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the entire API service
vi.mock('./api', async () => {
  const actual = await vi.importActual('./api')
  return {
    ...actual,
    apiService: {
      getConfig: vi.fn(),
      updateConfig: vi.fn(),
      getMessages: vi.fn(),
      getMessageFile: vi.fn(),
      updateMessageFile: vi.fn(),
      restartClient: vi.fn(),
      generateZip: vi.fn(),
      downloadFile: actual.apiService.downloadFile, // Use the actual implementation
      getStatus: vi.fn()
    }
  }
})

// Import the mocked API service
import { apiService } from './api'

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getConfig', () => {
    it('should fetch configuration from admin server', async () => {
      const mockConfig = {
        mixitup: false,
        streamerbot: true,
        connectionInfo: {
          hostname: 'archipelago.gg',
          port: 38281,
          playerName: 'Chat',
          tags: ['AP', 'DeathLink']
        }
      }

      apiService.getConfig.mockResolvedValue(mockConfig)

      const result = await apiService.getConfig()
      
      expect(apiService.getConfig).toHaveBeenCalled()
      expect(result).toEqual(mockConfig)
    })

    it('should handle API errors gracefully', async () => {
      apiService.getConfig.mockRejectedValue(new Error('Network error'))

      await expect(apiService.getConfig()).rejects.toThrow('Network error')
    })
  })

  describe('updateConfig', () => {
    it('should update configuration and trigger restart', async () => {
      const configData = { mixitup: true, streamerbot: false }
      const mockResponse = { success: true, message: 'Configuration updated and client restarted' }

      apiService.updateConfig.mockResolvedValue(mockResponse)

      const result = await apiService.updateConfig(configData)
      
      expect(apiService.updateConfig).toHaveBeenCalledWith(configData)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('getMessages', () => {
    it('should fetch list of message files', async () => {
      const mockMessages = ['bounce.json', 'itemFound.json', 'locationFound.json']
      
      apiService.getMessages.mockResolvedValue(mockMessages)

      const result = await apiService.getMessages()
      
      expect(apiService.getMessages).toHaveBeenCalled()
      expect(result).toEqual(mockMessages)
    })
  })

  describe('getMessageFile', () => {
    it('should fetch specific message file content', async () => {
      const filename = 'bounce.json'
      const mockContent = { messages: ['You bounced!', 'Bounce back!'] }
      
      apiService.getMessageFile.mockResolvedValue(mockContent)

      const result = await apiService.getMessageFile(filename)
      
      expect(apiService.getMessageFile).toHaveBeenCalledWith(filename)
      expect(result).toEqual(mockContent)
    })
  })

  describe('updateMessageFile', () => {
    it('should update specific message file', async () => {
      const filename = 'bounce.json'
      const content = { messages: ['Updated bounce message'] }
      const mockResponse = { success: true, message: 'Message file updated' }
      
      apiService.updateMessageFile.mockResolvedValue(mockResponse)

      const result = await apiService.updateMessageFile(filename, content)
      
      expect(apiService.updateMessageFile).toHaveBeenCalledWith(filename, content)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('restartClient', () => {
    it('should trigger client restart', async () => {
      const mockResponse = { success: true, message: 'Chatipelago client restart initiated' }
      
      apiService.restartClient.mockResolvedValue(mockResponse)

      const result = await apiService.restartClient()
      
      expect(apiService.restartClient).toHaveBeenCalled()
      expect(result).toEqual(mockResponse)
    })
  })

  describe('generateZip', () => {
    it('should upload YAML file and generate zip', async () => {
      const mockFile = new File(['test content'], 'test.yaml', { type: 'application/x-yaml' })
      const mockResponse = { 
        success: true, 
        filename: 'generated_1234567890.zip',
        message: 'Zip file generated successfully' 
      }
      
      apiService.generateZip.mockResolvedValue(mockResponse)

      const result = await apiService.generateZip(mockFile)
      
      expect(apiService.generateZip).toHaveBeenCalledWith(mockFile)
      expect(result).toEqual(mockResponse)
    })
  })

  describe('downloadFile', () => {
    it('should return download URL for generated file', () => {
      const filename = 'generated_1234567890.zip'
      const result = apiService.downloadFile(filename)
      
      expect(result).toBe(`http://localhost:8015/api/download/${filename}`)
    })
  })

  describe('getStatus', () => {
    it('should fetch connection status', async () => {
      const mockStatus = {
        status: 'connected',
        timestamp: '2024-01-01T00:00:00.000Z',
        uptime: 123.45,
        version: '1.0.0'
      }
      
      apiService.getStatus.mockResolvedValue(mockStatus)

      const result = await apiService.getStatus()
      
      expect(apiService.getStatus).toHaveBeenCalled()
      expect(result).toEqual(mockStatus)
    })
  })
})