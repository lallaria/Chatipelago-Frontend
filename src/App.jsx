import { useState } from 'react'
import { ConfigEditor } from './components/ConfigEditor'
import { MessageEditor } from './components/MessageEditor'
import { ConsoleOutput } from './components/ConsoleOutput'
import { APworldGenerator } from './components/APworldGenerator'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeLanding } from './components/HomeLanding'
import packageJson from '../package.json'

const tabs = [
  { id: 'home', label: 'Home', component: HomeLanding },
  { id: 'config', label: 'Configuration', component: ConfigEditor },
  { id: 'messages', label: 'Messages', component: MessageEditor },
  { id: 'console', label: 'Console', component: ConsoleOutput },
  { id: 'generator', label: 'Generator', component: APworldGenerator },
]

export const App = () => {
  const [activeTab, setActiveTab] = useState('home')
  const [gdprOpen, setGdprOpen] = useState(false)

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component
  const appVersion = packageJson?.version || 'dev'
  const connectedTo = import.meta.env.VITE_CONNECTED_TO || import.meta.env.VITE_ADMIN_API || ''
  const githubUrl = 'https://github.com/lallaria/Chatipelago-Frontend/'

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      {/* Header */}
      <header className="bg-base-100 shadow-sm border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <img 
                  src="https://img.prismativerse.com/icon.png" 
                  alt="Chatipelago" 
                  className="w-8 h-8"
                />
                <h1 className="text-xl font-bold">Chatipelago!</h1>
              </div>
            </div>
            
            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-base-100 border-b border-base-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ul className="tabs tabs-boxed tabs-lg w-full justify-start gap-1 bg-base-200 p-2">
            {tabs.map((tab) => (
              <li
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab ${activeTab === tab.id ? 'tab-active' : ''}`}
              >
                {tab.label}
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6">
        {ActiveComponent && <ActiveComponent onNavigate={setActiveTab} />}
      </main>

      {/* Footer */}
      <footer className="bg-base-100 border-t border-base-300 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm opacity-70">
                Chatipelago Frontend v{appVersion}
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm opacity-70 hover:opacity-100"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.464-1.11-1.464-.907-.62.069-.607.069-.607 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.833.091-.647.35-1.088.636-1.338-2.221-.253-4.555-1.113-4.555-4.952 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.748-1.026 2.748-1.026.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.337 4.696-4.565 4.944.359.31.679.921.679 1.856 0 1.339-.012 2.419-.012 2.749 0 .267.18.578.688.48A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                  </svg>
                  GitHub
                </a>
              </div>
            </div>
            
            {/* GDPR Information */}
            <div className="border-t border-base-300 pt-4">
              <div className="collapse collapse-arrow bg-base-200">
                <input 
                  type="checkbox" 
                  checked={gdprOpen}
                  onChange={(e) => setGdprOpen(e.target.checked)}
                />
                <div className="collapse-title text-sm font-semibold">
                  Privacy & Data Processing (GDPR)
                </div>
                <div className="collapse-content">
                  <div className="text-xs opacity-70 space-y-2">
                    <p>
                      This application processes data in compliance with GDPR (General Data Protection Regulation). 
                      When you upload YAML files for world generation or JSON configuration files, the following applies:
                    </p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>
                        <strong>Data Collection:</strong> Uploaded YAML files are temporarily stored on the server 
                        and processed to generate Archipelago world files (.apworld format) via a fork of
                        ArchipelagoMW/Archipelago. Yaml and Item/Location data is deleted immediately after processing.
                        JSON configuration files are stored only in browser memory and never sent to the server.
                      </li>
                      <li>
                        <strong>Data Storage:</strong> Generated chatipelago.apworld files are stored temporarily on the 
                        server. These are overwritten on each generation, and cleared out daily via a cron job. 
                      </li>
                      <li>
                        <strong>Data Purpose:</strong> Your files are used solely for the purpose of generating custom
                        chatipelago game worlds and client flavor text. No personal data is extracted or stored 
                        beyond what is necessary for this functionality.
                      </li>
                      <li>
                        <strong>Data Retention:</strong> Uploaded files and generated outputs are automatically deleted 
                        from the server after processing or after 24 hours. No persistent storage of your 
                        configuration data occurs.
                      </li>
                      <li>
                        <strong>Your Rights:</strong> Under GDPR, you have the right to access, rectify, erase, 
                        restrict processing, and object to processing of your data. Since files are automatically 
                        cleaned up, deletion occurs automatically. For any data protection inquiries, please contact 
                        Delilah via github.
                      </li>
                      <li>
                        <strong>Data Processing Location:</strong> Data processing occurs on a cloud server hosted by Hetzner,
                        a German company. The server is located in Ashburn, Virginia, USA.
                      </li>
                    </ul>
                    <p className="mt-2">
                      By using this application and uploading files, you consent to this data processing. 
                      No cookies or tracking technologies are used beyond standard server logs for operational purposes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
