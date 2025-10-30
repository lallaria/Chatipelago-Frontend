import { useState } from 'react'
import { ConfigEditor } from './components/ConfigEditor'
import { MessageEditor } from './components/MessageEditor'
import { ConsoleOutput } from './components/ConsoleOutput'
import { ZipGenerator } from './components/ZipGenerator'
import { ConnectionStatus } from './components/ConnectionStatus'

const tabs = [
  { id: 'config', label: 'Configuration', component: ConfigEditor },
  { id: 'messages', label: 'Messages', component: MessageEditor },
  { id: 'console', label: 'Console', component: ConsoleOutput },
  { id: 'generator', label: 'Generator', component: ZipGenerator },
]

export const App = () => {
  const [activeTab, setActiveTab] = useState('config')

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">Chatipelago Frontend</h1>
              </div>
            </div>
            
            <ConnectionStatus />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6">
        {ActiveComponent && <ActiveComponent />}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Chatipelago Frontend v1.0.0
            </div>
            <div className="text-sm text-gray-500">
              Connected to localhost:8015
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
