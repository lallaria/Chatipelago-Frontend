## Chatipelago Frontend

React/Vite frontend for managing and monitoring the local Chatipelago client. It runs in the browser (hosted at `chati.prismativerse.com` or locally) and talks to the Admin API exposed by the Chatipelago client on `http://localhost:8015`.

### Features
- **Configuration Management**: Edit `config.json` (validation, autosave optional, grouped sections)
- **Real-time Console**: Live client logs via SSE with filters, search, export
- **Connection Status**: Connected/Disconnected/Connecting with retry and history
- **Message Templates**: Browse/edit JSON templates with validation and live preview
- **Zip Generation**: Upload YAML, trigger server-side zip, download result

### Integration Modes
- `mixitup: true` → HTTP webhook server (port 1339)
- `streamerbot: true` → WebSocket to Streamer.bot (`localhost:8014`)
- Only one mode active at a time; Admin API on `8015` is always available

### Tech Stack
- React 18, Vite, Tailwind CSS
- State: React Context + useReducer
- Networking: axios, SSE for live console

### Prerequisites
- Chatipelago client running locally with Admin API enabled on `http://localhost:8015`
- Node.js 18+ (recommended) and npm or pnpm

### Quick Start
```bash
npm install
npm run dev
```
Then open the printed local URL (typically `http://localhost:5173`). The app will attempt to connect to `http://localhost:8015`.

### Build
```bash
npm run build
npm run preview
```

### Expected Admin API Endpoints (8015)
- `GET /api/config`, `PUT /api/config`
- `GET /api/messages`,
- `POST /api/restart`, 
- `GET /api/console` (SSE), `GET /api/status`

### Security Notes
- CORS will need to allow local dev origin
- No auth; intended for localhost-only Admin API
- YAML uploads limited to 1MB; temporary files cleaned up by server

### Project Structure (excerpt)
```
src/
  components/ (ConfigEditor, MessageEditor, ConsoleOutput, APworldGenerator, ConnectionStatus)
  hooks/ (useSSE, useConfig)
  services/ (api, sse)
  context/ (AppContext)
  utils/ (validation)
  App.jsx, main.jsx
```

### Please open an issue or find delilahisdidi on Discord if you have problems.

