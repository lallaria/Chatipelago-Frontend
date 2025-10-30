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
            
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <ConnectionStatus />
            </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm opacity-70">
              Chatipelago Frontend v{appVersion}
            </div>
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
      </footer>
    </div>
  )
}
