import axios from 'axios'

// Configure axios with base URL
const api = axios.create({
  baseURL: 'http://localhost:8015',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    return Promise.reject(error)
  }
)

export const apiService = {
  // Configuration endpoints
  async getConfig() {
    try {
      const response = await api.get('/api/config')
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch configuration: ${error.message}`)
    }
  },

  async updateConfig(configData) {
    try {
      const response = await api.put('/api/config', configData)
      return response.data
    } catch (error) {
      throw new Error(`Failed to update configuration: ${error.message}`)
    }
  },

  // Message file endpoints
  async getMessages() {
    try {
      const response = await api.get('/api/messages')
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch message files: ${error.message}`)
    }
  },

  async getMessageFile(filename) {
    try {
      const response = await api.get(`/api/messages/${filename}`)
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch message file: ${error.message}`)
    }
  },

  async updateMessageFile(filename, content) {
    try {
      const response = await api.put(`/api/messages/${filename}`, content)
      return response.data
    } catch (error) {
      throw new Error(`Failed to update message file: ${error.message}`)
    }
  },

  // Client management
  async restartClient() {
    try {
      const response = await api.post('/api/restart')
      return response.data
    } catch (error) {
      throw new Error(`Failed to restart client: ${error.message}`)
    }
  },

  // Zip generation
  async generateZip(yamlFile) {
    try {
      const formData = new FormData()
      formData.append('yamlFile', yamlFile)
      
      const response = await api.post('/api/generate-zip', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw new Error(`Failed to generate zip: ${error.message}`)
    }
  },

  downloadFile(filename) {
    return `${api.defaults.baseURL}/api/download/${filename}`
  },

  // Status endpoint
  async getStatus() {
    try {
      const response = await api.get('/api/status')
      return response.data
    } catch (error) {
      throw new Error(`Failed to fetch status: ${error.message}`)
    }
  },

  // Streamer.bot endpoints
  async connectStreamerbot() {
    try {
      const response = await api.post('/api/streamerbot/connect')
      return response.data
    } catch (error) {
      throw new Error(`Failed to connect to Streamer.bot: ${error.message}`)
    }
  },

  // Archipelago endpoints
  async connectArchipelago() {
    try {
      const response = await api.post('/api/archipelago/connect')
      return response.data
    } catch (error) {
      throw new Error(`Failed to connect to Archipelago: ${error.message}`)
    }
  },
}
