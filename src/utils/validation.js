export const validateConfig = (config) => {
  const errors = {}

  // Validate connection info
  if (!config.connectionInfo?.hostname?.trim()) {
    errors.connectionInfo = { hostname: 'Hostname is required' }
  }

  if (!config.connectionInfo?.playerName?.trim()) {
    errors.connectionInfo = { 
      ...errors.connectionInfo, 
      playerName: 'Player name is required' 
    }
  }

  if (config.connectionInfo?.port) {
    const port = parseInt(config.connectionInfo.port)
    if (isNaN(port) || port < 1 || port > 65535) {
      errors.connectionInfo = { 
        ...errors.connectionInfo, 
        port: 'Port must be between 1 and 65535' 
      }
    }
  }

  // Validate streamerbot config
  if (config.streamerbot) {
    if (config.streamerbotConfig?.port) {
      const port = parseInt(config.streamerbotConfig.port)
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.streamerbotConfig = { 
          ...errors.streamerbotConfig, 
          port: 'Port must be between 1 and 65535' 
        }
      }
    }

    if (!config.streamerbotConfig?.password?.trim()) {
      errors.streamerbotConfig = { 
        ...errors.streamerbotConfig, 
        password: 'Password is required for Streamer.bot' 
      }
    }
  }

  // Validate game settings
  if (config.gameSettings) {
    const { searchAttemptsRequired, lootAttemptsRequired, lootChance, checkCooldown } = config.gameSettings

    if (searchAttemptsRequired !== undefined) {
      const attempts = parseInt(searchAttemptsRequired)
      if (isNaN(attempts) || attempts < 1) {
        errors.gameSettings = { 
          ...errors.gameSettings, 
          searchAttemptsRequired: 'Search attempts must be at least 1' 
        }
      }
    }

    if (lootAttemptsRequired !== undefined) {
      const attempts = parseInt(lootAttemptsRequired)
      if (isNaN(attempts) || attempts < 1) {
        errors.gameSettings = { 
          ...errors.gameSettings, 
          lootAttemptsRequired: 'Loot attempts must be at least 1' 
        }
      }
    }

    if (lootChance !== undefined) {
      const chance = parseFloat(lootChance)
      if (isNaN(chance) || chance < 0 || chance > 1) {
        errors.gameSettings = { 
          ...errors.gameSettings, 
          lootChance: 'Loot chance must be between 0 and 1' 
        }
      }
    }

    if (checkCooldown !== undefined) {
      const cooldown = parseInt(checkCooldown)
      if (isNaN(cooldown) || cooldown < 0) {
        errors.gameSettings = { 
          ...errors.gameSettings, 
          checkCooldown: 'Check cooldown must be 0 or greater' 
        }
      }
    }
  }

  // Validate webhook URL if mixitup is enabled
  if (config.mixitup && config.webhookUrl) {
    try {
      new URL(config.webhookUrl)
    } catch {
      errors.webhookUrl = 'Invalid webhook URL format'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateYamlSchema = (yamlData) => {
  const errors = []

  if (!yamlData.items || !Array.isArray(yamlData.items) || yamlData.items.length !== 60) {
    errors.push('items must contain exactly 60 items')
  }

  if (!yamlData.progitems || !Array.isArray(yamlData.progitems) || yamlData.progitems.length !== 3) {
    errors.push('progitems must contain exactly 3 items')
  }

  if (!yamlData.trapitems || !Array.isArray(yamlData.trapitems) || yamlData.trapitems.length !== 3) {
    errors.push('trapitems must contain exactly 3 items')
  }

  if (!yamlData.locations || !Array.isArray(yamlData.locations) || yamlData.locations.length !== 50) {
    errors.push('locations must contain exactly 50 items')
  }

  if (!yamlData.proglocations || !Array.isArray(yamlData.proglocations) || yamlData.proglocations.length !== 10) {
    errors.push('proglocations must contain exactly 10 items')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateMessageTemplate = (template) => {
  const errors = []

  if (typeof template !== 'object' || template === null) {
    errors.push('Template must be a valid JSON object')
    return { isValid: false, errors }
  }

  // Check for required fields
  if (!template.messages || !Array.isArray(template.messages)) {
    errors.push('Template must contain a "messages" array')
  }

  if (template.messages && template.messages.length === 0) {
    errors.push('Template must contain at least one message')
  }

  // Validate template variables in messages
  if (template.messages && Array.isArray(template.messages)) {
    const validVariables = ['{item}', '{player}', '{location}', '{count}', '{time}']
    
    template.messages.forEach((message, index) => {
      if (typeof message !== 'string') {
        errors.push(`Message ${index + 1} must be a string`)
        return
      }

      // Check for valid template variables
      const variables = message.match(/\{[^}]+\}/g) || []
      variables.forEach(variable => {
        if (!validVariables.includes(variable)) {
          errors.push(`Message ${index + 1} contains invalid variable: ${variable}`)
        }
      })
    })
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
