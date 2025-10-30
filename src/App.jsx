import { useState } from 'react'
import { ConfigEditor } from './components/ConfigEditor'
import { MessageEditor } from './components/MessageEditor'
import { ConsoleOutput } from './components/ConsoleOutput'
import { ZipGenerator } from './components/ZipGenerator'
import { ConnectionStatus } from './components/ConnectionStatus'
import { ThemeToggle } from './components/ThemeToggle'
import { HomeLanding } from './components/HomeLanding'
import packageJson from '../package.json'

const tabs = [
  { id: 'home', label: 'Home', component: HomeLanding },
  { id: 'config', label: 'Configuration', component: ConfigEditor },
  { id: 'messages', label: 'Messages', component: MessageEditor },
  { id: 'console', label: 'Console', component: ConsoleOutput },
  { id: 'generator', label: 'Generator', component: ZipGenerator },
]

export const App = () => {
  const [activeTab, setActiveTab] = useState('home')

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component
  const appVersion = packageJson?.version || 'dev'
  const connectedTo = import.meta.env.VITE_CONNECTED_TO || import.meta.env.VITE_ADMIN_API || ''

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
            {connectedTo && (
              <div className="text-sm opacity-70">
                Connected to {connectedTo}
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  )
}
