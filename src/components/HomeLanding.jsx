export const HomeLanding = ({ onNavigate }) => {
  const go = (tabId) => () => onNavigate && onNavigate(tabId)

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <img
            src="https://img.prismativerse.com/icon.png"
            alt="Chatipelago"
            className="w-10 h-10"
          />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome to Chatipelago</h2>
            <p className="text-gray-600">Manage and monitor your local Chatipelago client.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-5 hover:shadow-sm transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Configuration</h3>
            <p className="text-gray-600 mb-4">Edit `config.json`, switch integration modes, tune game settings.</p>
            <button onClick={go('config')} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 btn-hover">Open Configuration →</button>
          </div>

          <div className="border rounded-lg p-5 hover:shadow-sm transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Messages</h3>
            <p className="text-gray-600 mb-4">Browse and edit JSON templates with validation and live preview.</p>
            <button onClick={go('messages')} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 btn-hover">Edit Messages →</button>
          </div>

          <div className="border rounded-lg p-5 hover:shadow-sm transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Console</h3>
            <p className="text-gray-600 mb-4">View real-time logs via SSE. Filter, search, and export.</p>
            <button onClick={go('console')} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 btn-hover">View Console →</button>
          </div>

          <div className="border rounded-lg p-5 hover:shadow-sm transition">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Generator</h3>
            <p className="text-gray-600 mb-4">Upload YAML to generate a zip using the local Admin API.</p>
            <button onClick={go('generator')} className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 btn-hover">Open Generator →</button>
          </div>
        </div>

        <div className="mt-6 text-sm text-gray-600">
          <p>Admin API expected at <span className="font-mono">http://localhost:8015</span>. Ensure your Chatipelago client is running.</p>
        </div>
      </div>
    </div>
  )
}


