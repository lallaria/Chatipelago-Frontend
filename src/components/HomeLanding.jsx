import { useState } from 'react'
import ChatYaml from '../defaults/Chat.yaml?raw'
import CustomChatiAPWorld from '../defaults/CustomChatiAPWorld.yml?raw'
// @ts-ignore - Vite handles ?url for binary files
import apworldUrl from '../defaults/chatipelago.apworld?url'

export const HomeLanding = ({ onNavigate }) => {
  const [instructionsExpanded, setInstructionsExpanded] = useState(false)
  const go = (tabId) => () => onNavigate && onNavigate(tabId)

  const downloadFile = (content, filename, mimeType = 'text/yaml') => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDownloadChatYaml = () => {
    downloadFile(ChatYaml, 'Chat.yaml', 'text/yaml')
  }

  const handleDownloadCustomChatiAPWorld = () => {
    downloadFile(CustomChatiAPWorld, 'CustomChatiAPWorld.yml', 'text/yaml')
  }

  const handleDownloadApworld = () => {
    // Use Vite's ?url import to get the file URL
    fetch(apworldUrl)
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'chatipelago.apworld'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      })
      .catch(err => {
        console.error('Failed to download apworld:', err)
        alert(`Failed to download apworld file: ${err.message}`)
      })
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="card bg-base-100 shadow-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <img
            src="https://img.prismativerse.com/icon.png"
            alt="Chatipelago"
            className="w-10 h-10"
          />
          <div>
            <h2 className="text-2xl font-bold">Welcome to Chatipelago</h2>
          </div>
        </div>

        <div className="mb-6 collapse collapse-arrow bg-base-200 border border-base-300">
          <input
            type="checkbox"
            checked={instructionsExpanded}
            onChange={(e) => setInstructionsExpanded(e.target.checked)}
          />
          <div className="collapse-title text-lg font-semibold">
            Setup Instructions
          </div>
          <div className="collapse-content">
            <div className="space-y-3 text-sm">
              <ol className="list-decimal list-inside space-y-2">
                <li>Create or download a <code className="bg-base-300 px-1 rounded">chatipelago.apworld</code></li>
                <li>Download the base chatipelago YAML</li>
                <li>Generate an Archipelago game using the chatipelago apworld and YAML</li>
                <li>Download the Chatipelago Client from <a href="https://github.com/lallaria/Chatipelago/releases" target="_blank" rel="noopener noreferrer" className="link link-primary">GitHub Releases</a></li>
                <li>Install either Streamer.bot or MixItUp</li>
                <li>Run the import for Streamer.bot or the imports for MixItUp</li>
                <li>Run the Chatipelago Client</li>
                <li>Modify the settings of the Chatipelago Client and restart</li>
                <li><strong>Play!</strong></li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mb-6 card bg-base-200 border border-base-300">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-3">Default Templates</h3>
            <p className="text-base-content/70 mb-4 text-sm">
              Don't want to generate your own? Download these pre-configured templates to get started quickly.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">Chat.yaml</span>
                  <span className="text-xs text-base-content/60 ml-2">For Archipelago game generation</span>
                </div>
                <button onClick={handleDownloadChatYaml} className="btn btn-sm btn-primary">
                  Download
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">CustomChatiAPWorld.yml</span>
                  <span className="text-xs text-base-content/60 ml-2">Template for APworld generator</span>
                </div>
                <button onClick={handleDownloadCustomChatiAPWorld} className="btn btn-sm btn-primary">
                  Download
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">chatipelago.apworld</span>
                  <span className="text-xs text-base-content/60 ml-2">Default APworld file</span>
                </div>
                <button onClick={handleDownloadApworld} className="btn btn-sm btn-primary">
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-1">Configuration</h3>
              <p className="text-base-content/70 mb-4">Edit `config.json`, switch integration modes, tune game settings.</p>
              <button onClick={go('config')} className="btn btn-primary">Open Configuration →</button>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-1">Messages</h3>
              <p className="text-base-content/70 mb-4">Browse and edit JSON templates with validation and live preview.</p>
              <button onClick={go('messages')} className="btn btn-primary">Edit Messages →</button>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-1">Console</h3>
              <p className="text-base-content/70 mb-4">View real-time logs via SSE. Filter, search, and export.</p>
              <button onClick={go('console')} className="btn btn-primary">View Console →</button>
            </div>
          </div>

          <div className="card bg-base-200 border border-base-300">
            <div className="card-body">
              <h3 className="text-lg font-semibold mb-1">Generator</h3>
              <p className="text-base-content/70 mb-4">Upload YAML or fill in fields to generate a custom chatipielago.apworld</p>
              <button onClick={go('generator')} className="btn btn-primary">Open Generator →</button>
            </div>
          </div>
        </div>

        <div className="mt-6 text-sm text-base-content/70">
          <p>Ensure your Chatipelago client is running.</p>
        </div>
      </div>
    </div>
  )
}


