# Chatipelago Frontend Specification

## Overview
A web-based frontend application for managing and monitoring the Chatipelago client. The frontend will be hosted on `chati.prismativerse.com` and connect to a local Chatipelago client running on the user's machine.

## Architecture

### Hosting
- **Domain**: `chati.prismativerse.com`
- **Technology Stack**: React (chosen for simplicity and ecosystem)

### Chatipelago Architecture
- **Chatipelago Client**: Connects to `archipelago.gg:38281` (Archipelago server)
- **Streamer.bot Integration**: `localhost:8014` (WebSocket server) - when `streamerbot: true`
- **Mixitup Integration**: `https://mixitup.webhook/` (HTTP webhook) - when `mixitup: true`
- **Admin API**: `localhost:8015` (New admin server for frontend)

### Conditional Integration Logic
The Chatipelago client supports one integration mode at a time, controlled by config flags:
- **`mixitup: true`**: Enables HTTP webhook server on port 1339 for Mixitup integration
- **`streamerbot: true`**: Enables WebSocket connection to Streamer.bot on port 8014
- **Mutually exclusive**: Only one integration can be active at a time
- **Admin API (port 8015)**: Always available for frontend management

### Backend Integration
- **API Protocol**: HTTP connection to admin on localhost (port 8015)
- **Configuration**: Direct modification of local `config.json` file via admin API
- **Auto-restart**: Automatic restart of Chatipelago client when configuration changes

## Core Features

### 1. Configuration Management
**Purpose**: Allow users to modify Chatipelago client settings through a web interface.

**Implementation**:
- Convert `config.js` to `config.json` format (aligns with Streamerbot toolkit)
- Real-time editing of configuration values
- Form validation for all configuration fields
- Auto-save functionality with confirmation

**Configuration Fields** (JSON format):
```json
{
  "mixitup": false,
  "streamerbot": true,
  "connectionInfo": {
    "hostname": "archipelago.gg",
    "port": 38281,
    "playerName": "Chat",
    "tags": ["AP", "DeathLink"]
  },
  "webhookUrl": "https://mixitup.webhook/",
  "streamerbotConfig": {
    "port": 8014,
    "endpoint": "/chati",
    "password": "delilahsbasement",
    "autoConnect": true,
    "reconnect": true
  },
  "streamerbotActions": {
    "trapMessage": "929a40f0-eb5f-44a8-a94a-368e144fbde2",
    "bouncedMessage": "185e6b60-3bd0-4a93-8644-3832ef7ca890"
  },
  "gameSettings": {
    "searchAttemptsRequired": 5,
    "lootAttemptsRequired": 5,
    "lootChance": 0.7,
    "checkCooldown": 240
  }
}
```

**UI Components**:
- Collapsible sections for each configuration group
- Input validation (numbers, required fields, port ranges)
- Save/Cancel buttons with confirmation dialogs
- Current vs. pending changes indicator

### 2. Real-time Console Output
**Purpose**: Display all console.log messages from the Chatipelago client in real-time.

**Implementation**:
- Server-Sent Events (SSE) connection to admin server for console messages
- Scrollable terminal-style interface
- Message filtering options (All, Errors, Events, Commands)
- Timestamp display for each message
- Auto-scroll to latest messages (toggleable)
- Message search functionality

**UI Components**:
- Terminal-style console window
- Filter dropdown (All, Errors, Events, Commands)
- Search input with highlight
- Clear console button
- Auto-scroll toggle
- Export logs button (download as .txt)

### 3. Connection Status
**Purpose**: Display and manage connection status to the local Chatipelago client.

**Implementation**:
- Real-time connection status indicator
- Connection retry mechanism
- Connection history log
- Automatic reconnection on config changes

**UI Components**:
- Status indicator (Connected/Disconnected/Connecting)
- Last connection time
- Connection error messages
- Manual reconnect button

### 4. Message Template Editor
**Purpose**: Allow users to edit chat message templates stored in JSON files.

**Implementation**:
- File browser for all JSON files in `/messages` directory
- Real-time JSON editor with syntax highlighting
- Template variable validation (e.g., `{item}`, `{player}`, `{location}`)
- Live preview of message templates
- Bulk editing capabilities

**Message Files**:
- `bounce.json` - Bounce messages
- `bounced.json` - Bounced messages  
- `hintedItem.json` - Hinted item messages
- `itemFound.json` - Item found messages
- `itemMissed.json` - Item missed messages
- `itemRecieved.json` - Item received messages
- `itemTrap.json` - Item trap messages
- `locationFound.json` - Location found messages
- `offCooldown.json` - Off cooldown messages
- `selfFind.json` - Self find messages
- `theKiller.json` - The killer messages

**UI Components**:
- File tree browser for message files
- JSON editor with syntax highlighting
- Template variable reference panel
- Live preview window
- Save/Revert buttons
- Search/filter messages

### 5. APworld File Generation
**Purpose**: Generate and download an apworld launched with a subprocess on the same server as the frontend, with user-provided YAML input.

**Implementation**:
- File upload for YAML input files (max 1MB)
- Front end calls subprocess: `/apworldgen/buildapworld.py`
- Progress indicator during generation
- Download link for generated apworld
- File cleanup after download (stored in `/tmp`)

**YAML Schema**:
- 5 lists containing exactly: 60 items, 3 progitems, 3 trapitems, 50 locations, 10 proglocations
- Client-side validation before upload

**UI Components**:
- File upload area (drag & drop + browse)
- YAML validation preview with schema checking
- Generate button with progress indicator
- Download link when ready
- Error handling for invalid YAML schema

## Technical Requirements

### Frontend Stack
- **Framework**: React 18+
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + useReducer
- **Real-time Communication**: Server-Sent Events (SSE) for console logs
- **File Handling**: FileReader API for YAML uploads

### Backend Modifications Required
- **Convert to `config.json` format** (align with Streamerbot toolkit approach)
- Add HTTP server with CORS configuration for `chati.prismativerse.com`
- Add API endpoints for:
  - Configuration CRUD operations (`GET/PUT /api/config`)
  - Console log streaming via Server-Sent Events (SSE)
  - Zip file generation (`POST /api/generate-zip`)
  - Client restart trigger (`POST /api/restart`)
- Add Server-Sent Events (SSE) support for console log streaming
- Add file system access for configuration management

### Security Considerations
- CORS restricted to `chati.prismativerse.com` only
- No authentication required (local network access)
- Input validation on all configuration fields
- File upload restrictions (YAML only, max 1MB)
- Temporary files stored in `/tmp` with automatic cleanup

## API Endpoints

### API Endpoints (Admin Server - Port 8015)
- `GET /api/config` - Retrieve current configuration as JSON
- `PUT /api/config` - Update configuration (writes to config.json)
- `GET /api/messages` - List all message files
- `GET /api/messages/:filename` - Retrieve specific message file
- `PUT /api/messages/:filename` - Update specific message file
- `POST /api/restart` - Restart Chatipelago client
- `POST /api/generate-zip` - Generate apworld from YAML (subprocess: `touch testing.zip`)
- `GET /api/download/:filename` - Download generated apworld
- `GET /api/console` - Server-Sent Events stream for console logs
- `GET /api/status` - Connection status information

### Architecture Benefits
- **Separation of Concerns**: Admin API isolated from main Chatipelago functionality
- **Independent Development**: Can be built and tested separately
- **Security**: Admin port can have different security requirements
- **Scalability**: Admin server can be disabled in production if needed

### Error Handling Strategy
- **Connection Failures**: Show error message, no retry logic
- **API Errors**: Display user-friendly error messages
- **File Upload Errors**: Validate YAML schema client-side before upload
- **Process Failures**: Show error when admin server unreachable

### File Management
- **Upload Directory**: `/tmp` for YAML files
- **Generated Files**: `/tmp` for apworlds
- **File Size Limit**: 1MB maximum for YAML uploads
- **Cleanup**: Automatic cleanup after download or timeout

## User Interface Layout

### Header
- Chatipelago logo/title
- Connection status indicator
- Navigation tabs (Config, Messages, Console, Generator)

### Main Content Area
- **Configuration Tab**: Form-based configuration editor
- **Messages Tab**: JSON editor for message templates
- **Console Tab**: Terminal-style console output
- **Generator Tab**: YAML upload and zip generation

### Footer
- Version information
- Connection details
- Last update timestamp

## Development Phases

### Phase 0: Backend Infrastructure (Prerequisite)
- Admin API server implementation (port 8015)
- Configuration management endpoints
- Console log streaming setup
- CORS configuration

### Phase 1: Core Infrastructure
- React application setup
- HTTP connection to admin server
- Basic UI layout and navigation

### Phase 2: Configuration Management
- Configuration form implementation
- File system integration for config.json
- Auto-restart functionality

### Phase 3: Message Template Editor
- JSON editor implementation
- Message file browser
- Template variable validation
- Live preview functionality

### Phase 4: Console Output
- Real-time console log streaming
- Terminal UI implementation
- Message filtering and search

### Phase 5: Zip Generation
- YAML upload functionality
- Server-side zip generation
- Download management

### Phase 6: Polish & Testing
- UI/UX improvements
- Error handling
- Cross-browser testing
- Performance optimization

## File Structure
```
chatipelago-frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── ConfigEditor.jsx
│   │   ├── MessageEditor.jsx
│   │   ├── ConsoleOutput.jsx
│   │   ├── APworldGenerator.jsx
│   │   └── ConnectionStatus.jsx
│   ├── hooks/
│   │   ├── useSSE.js
│   │   └── useConfig.js
│   ├── services/
│   │   ├── api.js
│   │   └── sse.js
│   ├── context/
│   │   └── AppContext.js
│   ├── utils/
│   │   └── validation.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Dependencies
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Success Criteria
- [ ] Successfully connects to local Chatipelago client
- [ ] Configuration changes trigger automatic client restart
- [ ] Real-time console output displays all client logs
- [ ] YAML upload and zip generation works end-to-end
- [ ] Responsive design works on desktop and mobile
- [ ] Error handling covers all failure scenarios
- [ ] CORS security properly configured
