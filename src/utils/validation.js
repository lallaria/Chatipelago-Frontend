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

  // Validate mixitup config
  if (config.mixitup) {
    if (config.mixitupConfig?.port) {
      const port = parseInt(config.mixitupConfig.port)
      if (isNaN(port) || port < 1 || port > 65535) {
        errors.mixitupConfig = { 
          ...errors.mixitupConfig, 
          port: 'Port must be between 1 and 65535' 
        }
      }
    }

    if (config.mixitupConfig?.webhookUrl) {
      try {
        new URL(config.mixitupConfig.webhookUrl)
      } catch {
        errors.mixitupConfig = { 
          ...errors.mixitupConfig, 
          webhookUrl: 'Invalid webhook URL format' 
        }
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

export const validateYamlSchema = (yamlData) => {
  const errors = []

  // Support both nested and flat structures
  const isNested = yamlData.items && typeof yamlData.items === 'object' && !Array.isArray(yamlData.items)
  
  if (isNested) {
    // Validate nested structure
    if (!yamlData.items || typeof yamlData.items !== 'object') {
      errors.push('items must be an object with normal, trap, filler, and prog properties')
    } else {
      if (!Array.isArray(yamlData.items.normal)) {
        errors.push('items.normal must be an array')
      }
      if (!Array.isArray(yamlData.items.trap)) {
        errors.push('items.trap must be an array')
      }
      if (!Array.isArray(yamlData.items.filler)) {
        errors.push('items.filler must be an array')
      }
      if (!Array.isArray(yamlData.items.prog)) {
        errors.push('items.prog must be an array')
      }
    }

    if (!yamlData.locations || typeof yamlData.locations !== 'object') {
      errors.push('locations must be an object with chatroom and prog properties')
    } else {
      if (!Array.isArray(yamlData.locations.chatroom)) {
        errors.push('locations.chatroom must be an array')
      }
      if (!Array.isArray(yamlData.locations.prog)) {
        errors.push('locations.prog must be an array')
      }
    }
  } else {
    // Validate flat structure
    if (!yamlData.items || !Array.isArray(yamlData.items) || yamlData.items.length !== 60) {
      errors.push('items must contain exactly 60 items')
    }

    if (!yamlData.progitems || !Array.isArray(yamlData.progitems) || yamlData.progitems.length !== 3) {
      errors.push('progitems must contain exactly 3 items')
    }

    if (!yamlData.trapitems || !Array.isArray(yamlData.trapitems) || yamlData.trapitems.length !== 3) {
      errors.push('trapitems must contain exactly 3 items')
    }

    if (!yamlData.filleritems || !Array.isArray(yamlData.filleritems) || yamlData.filleritems.length !== 3) {
      errors.push('filleritems must contain exactly 3 items')
    }

    if (!yamlData.locations || !Array.isArray(yamlData.locations) || yamlData.locations.length !== 50) {
      errors.push('locations must contain exactly 50 items')
    }

    if (!yamlData.proglocations || !Array.isArray(yamlData.proglocations) || yamlData.proglocations.length !== 10) {
      errors.push('proglocations must contain exactly 10 items')
    }
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
    const validVariables = ['{item}', '{player}', '{location}', '{receiver}']
    
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
