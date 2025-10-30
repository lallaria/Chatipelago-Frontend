import { useState, useRef } from 'react'
import { apiService } from '../services/api'
import { validateYamlSchema } from '../utils/validation'
import * as yaml from 'js-yaml'

export const ZipGenerator = () => {
  const [file, setFile] = useState(null)
  const [yamlContent, setYamlContent] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [generating, setGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return

    // Validate file type
    if (!selectedFile.name.endsWith('.yaml') && !selectedFile.name.endsWith('.yml')) {
      setError('Please select a YAML file (.yaml or .yml)')
      return
    }

    // Validate file size (1MB limit)
    if (selectedFile.size > 1024 * 1024) {
      setError('File size must be less than 1MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    setValidationErrors([])
    setDownloadUrl(null)

    // Read and validate YAML content
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target.result
        const yamlData = yaml.load(content)
        setYamlContent(yamlData)
        
        // Validate YAML schema
        const validation = validateYamlSchema(yamlData)
        setValidationErrors(validation.errors)
      } catch (err) {
        setError(`Invalid YAML format: ${err.message}`)
      }
    }
    reader.readAsText(selectedFile)
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0])
    }
  }

  const handleGenerate = async () => {
    if (!file || validationErrors.length > 0) return

    try {
      setGenerating(true)
      setError(null)
      
      const result = await apiService.generateZip(file)
      setDownloadUrl(apiService.downloadFile(result.filename))
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setYamlContent(null)
    setValidationErrors([])
    setDownloadUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const renderYamlPreview = () => {
    if (!yamlContent) return null

    return (
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900">YAML Content Preview:</h4>
        <div className="bg-gray-100 border border-gray-200 rounded-md p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm font-mono">
            {JSON.stringify(yamlContent, null, 2)}
          </pre>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="bg-blue-50 p-3 rounded">
            <div className="font-semibold text-blue-900">Items</div>
            <div className="text-blue-700">
              {yamlContent.items?.length || 0} / 60
            </div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="font-semibold text-green-900">Prog Items</div>
            <div className="text-green-700">
              {yamlContent.progitems?.length || 0} / 10
            </div>
          </div>
          <div className="bg-red-50 p-3 rounded">
            <div className="font-semibold text-red-900">Trap Items</div>
            <div className="text-red-700">
              {yamlContent.trapitems?.length || 0} / 10
            </div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="font-semibold text-yellow-900">Locations</div>
            <div className="text-yellow-700">
              {yamlContent.locations?.length || 0} / 50
            </div>
          </div>
          <div className="bg-purple-50 p-3 rounded">
            <div className="font-semibold text-purple-900">Prog Locations</div>
            <div className="text-purple-700">
              {yamlContent.proglocations?.length || 0} / 10
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Zip File Generator</h2>
        <p className="text-gray-600">Upload a YAML file to generate a zip file for your game</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload YAML File</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-400 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="text-green-600">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-gray-400">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    Drop your YAML file here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports .yaml and .yml files up to 1MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Choose File
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* YAML Validation */}
        {yamlContent && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">YAML Validation</h3>
            
            {validationErrors.length > 0 ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <h4 className="font-semibold mb-2">Validation Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  YAML file is valid and ready for processing
                </div>
              </div>
            )}

            {renderYamlPreview()}
          </div>
        )}

        {/* Generation Controls */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Zip File</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600">
                {file ? `Ready to generate zip from ${file.name}` : 'Please upload a YAML file first'}
              </p>
              {validationErrors.length > 0 && (
                <p className="text-red-600 text-sm mt-1">
                  Fix validation errors before generating
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                disabled={!file}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleGenerate}
                disabled={!file || generating || validationErrors.length > 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Generating...' : 'Generate Zip'}
              </button>
            </div>
          </div>

          {generating && (
            <div className="mt-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700">Generating zip file...</span>
                </div>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-700">Zip file generated successfully!</span>
                  </div>
                  <a
                    href={downloadUrl}
                    download
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">YAML Schema Requirements</h3>
          <p className="text-blue-700 mb-3">
            Your YAML file must contain exactly the following lists:
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li><strong>items:</strong> Exactly 60 items</li>
            <li><strong>progitems:</strong> Exactly 10 progression items</li>
            <li><strong>trapitems:</strong> Exactly 10 trap items</li>
            <li><strong>locations:</strong> Exactly 50 locations</li>
            <li><strong>proglocations:</strong> Exactly 10 progression locations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
