import { useState, useRef, useEffect } from 'react'
import { validateYamlSchema } from '../utils/validation'
import * as yaml from 'js-yaml'
import CustomChatiAPWorld from '../defaults/CustomChatiAPWorld.yml?raw'
import ChatYaml from '../defaults/Chat.yaml?raw'
// @ts-ignore - Vite handles ?url for binary files
import apworldUrl from '../defaults/chatipelago.apworld?url'

export const APworldGenerator = () => {
  const [file, setFile] = useState(null)
  const [yamlContent, setYamlContent] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [generating, setGenerating] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const [error, setError] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  // Manual lists input
  const [itemsText, setItemsText] = useState('')
  const [progItemsText, setProgItemsText] = useState('')
  const [trapItemsText, setTrapItemsText] = useState('')
  const [locationsText, setLocationsText] = useState('')
  const [progLocationsText, setProgLocationsText] = useState('')

  const parseLines = (text) =>
    text
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

  const rebuildManualYamlIfApplicable = () => {
    // Only build from manual inputs when a file is not selected
    if (file) return

    // Build nested structure to match schema
    const manual = {
      items: {
        normal: parseLines(itemsText),
        trap: parseLines(trapItemsText),
        filler: [], // Manual input doesn't have filler yet
        prog: parseLines(progItemsText),
      },
      locations: {
        chatroom: parseLines(locationsText),
        prog: parseLines(progLocationsText),
      },
    }

    const allEmpty =
      manual.items.normal.length === 0 &&
      manual.items.prog.length === 0 &&
      manual.items.trap.length === 0 &&
      manual.locations.chatroom.length === 0 &&
      manual.locations.prog.length === 0

    if (allEmpty) {
      setYamlContent(null)
      setValidationErrors([])
      return
    }

    setYamlContent(manual)
    const validation = validateYamlSchema(manual)
    setValidationErrors(validation.errors)
  }

  // Rebuild manual YAML when inputs change (avoid stale state during onChange)
  useEffect(() => {
    rebuildManualYamlIfApplicable()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsText, progItemsText, trapItemsText, locationsText, progLocationsText, file])

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
    if (!(file || yamlContent) || validationErrors.length > 0) return

    try {
      setGenerating(true)
      setError(null)

      // Build the required YAML schema
      let payloadYaml = ''
      if (yamlContent) {
        // Accept both nested and legacy flat shapes from uploaded file/manual
        const isNested = yamlContent.items && typeof yamlContent.items === 'object' && !Array.isArray(yamlContent.items)
        const nested = isNested
          ? yamlContent
          : {
              items: {
                normal: yamlContent.items || [],
                trap: yamlContent.trapitems || [],
                filler: yamlContent.filleritems || [],
                prog: yamlContent.progitems || [],
              },
              locations: {
                chatroom: yamlContent.locations || [],
                prog: yamlContent.proglocations || [],
              },
            }
        payloadYaml = yaml.dump(nested, { sortKeys: false })
      } else if (file) {
        // Read the file content to string
        const text = await file.text()
        payloadYaml = text
      }

      // POST to local builder service
      const resp = await fetch('http://localhost:8123/apworld/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-yaml' },
        body: payloadYaml,
      })
      if (!resp.ok) {
        const info = await resp.json().catch(() => ({}))
        throw new Error(info.error || `Build failed with status ${resp.status}`)
      }

      // Point to local download endpoint
      setDownloadUrl('http://localhost:8123/apworld/download')
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
    if (downloadUrl) {
      try { URL.revokeObjectURL(downloadUrl) } catch {}
    }
    setDownloadUrl(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setItemsText('')
    setProgItemsText('')
    setTrapItemsText('')
    setLocationsText('')
    setProgLocationsText('')
  }

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

  const handleDownloadCustomChatiAPWorld = () => {
    downloadFile(CustomChatiAPWorld, 'CustomChatiAPWorld.yml', 'text/yaml')
  }

  const handleDownloadChatYaml = () => {
    downloadFile(ChatYaml, 'Chat.yaml', 'text/yaml')
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
        setError(`Failed to download apworld file: ${err.message}`)
      })
  }

  const renderYamlPreview = () => {
    if (!yamlContent) return null

    return (
      <div className="space-y-4">
        <h4 className="font-semibold font-bold">APWorld Content Preview:</h4>
        <div className="card bg-base-200 border border-base-300 p-4 max-h-64 overflow-y-auto">
          <pre className="text-sm font-mono">
            {JSON.stringify(yamlContent, null, 2)}
          </pre>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
          <div className="bg-info/20 p-3 ">
            <div className="font-semibold text-info">Generic Items</div>
            <div className="text-info">
              {Array.isArray(yamlContent.items) 
                ? yamlContent.items.length 
                : yamlContent.items?.normal?.length || 0}
            </div>
          </div>
          <div className="bg-success/20 p-3 ">
            <div className="font-semibold text-green-900">Progression Items</div>
            <div className="text-success">
              {Array.isArray(yamlContent.items)
                ? yamlContent.progitems?.length || 0
                : yamlContent.items?.prog?.length || 0}
            </div>
          </div>
          <div className="bg-red-50 p-3 ">
            <div className="font-semibold text-red-900">Trap Items</div>
            <div className="text-red-700">
              {Array.isArray(yamlContent.items)
                ? yamlContent.trapitems?.length || 0
                : yamlContent.items?.trap?.length || 0}
            </div>
          </div>
          <div className="bg-yellow-50 p-3 ">
            <div className="font-semibold text-yellow-900">Locations</div>
            <div className="text-yellow-700">
              {Array.isArray(yamlContent.locations)
                ? yamlContent.locations.length
                : yamlContent.locations?.chatroom?.length || 0}
            </div>
          </div>
          <div className="bg-purple-50 p-3 ">
            <div className="font-semibold text-purple-900">Priority Locations</div>
            <div className="text-purple-700">
              {Array.isArray(yamlContent.locations)
                ? yamlContent.proglocations?.length || 0
                : yamlContent.locations?.prog?.length || 0}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-bold mb-2">APworld File Generator</h2>
        <p className="text-base-content/70">Upload a YAML file to generate an apworld for your game</p>
      </div>

      <div className="mb-6 card bg-base-200 border border-base-300">
        <div className="card-body p-4">
          <h3 className="text-sm font-semibold mb-2">Default Templates</h3>
          <p className="text-xs text-base-content/70 mb-3">
            Need a starting point? Download these templates:
          </p>
          <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadCustomChatiAPWorld} className="btn btn-xs btn-primary">
              CustomChatiAPWorld.yml
            </button>
            <button onClick={handleDownloadChatYaml} className="btn btn-xs btn-primary">
              Chat.yaml
            </button>
            <button onClick={handleDownloadApworld} className="btn btn-xs btn-primary">
              chatipelago.apworld
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error px-4 py-3  mb-4">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* File Upload Area */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h3 className="text-lg font-semibold font-bold mb-4">Upload YAML File</h3>
          
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-info/20'
                : 'border-base-300 hover:border-base-content/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-4">
                <div className="text-success">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium font-bold">{file.name}</p>
                  <p className="text-sm text-base-content/60">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className=" input input-bordered text-base-content hover:bg-gray-50"
                >
                  Remove File
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-base-content/50">
                  <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-medium font-bold">
                    Drop your YAML file here, or click to browse
                  </p>
                  <p className="text-sm text-base-content/60">
                    Supports .yaml and .yml files up to 1MB
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-primary"
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
          <div className="card bg-base-100 shadow-lg p-6">
            <h3 className="text-lg font-semibold font-bold mb-4">YAML Validation</h3>
            
            {validationErrors.length > 0 ? (
              <div className="alert alert-error px-4 py-3  mb-4">
                <h4 className="font-semibold mb-2">Validation Errors:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="alert alert-success px-4 py-3  mb-4">
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
        <div className="card bg-base-100 shadow-lg p-6">
          <h3 className="text-lg font-semibold font-bold mb-4">Generate APworld File</h3>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base-content/70">
                {file
                  ? `Ready to generate zip from ${file.name}`
                  : yamlContent
                  ? 'Ready to generate zip from manual lists'
                  : 'Upload a YAML file or enter lists below'}
              </p>
              {validationErrors.length > 0 && (
                <p className="text-error text-sm mt-1">
                  Fix validation errors before generating
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleReset}
                disabled={!file && !yamlContent}
                className="btn btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
              <button
                onClick={handleGenerate}
                disabled={!(file || yamlContent) || generating || validationErrors.length > 0}
                className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {generating ? 'Building...' : 'Build APWorld'}
              </button>
            </div>
          </div>

          {generating && (
            <div className="mt-4">
              <div className="card bg-info/10 border border-info/30  p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-3"></div>
                  <span className="text-info">Preparing YAML...</span>
                </div>
              </div>
            </div>
          )}

          {downloadUrl && (
            <div className="mt-4">
              <div className="card bg-success/10 border border-success/30  p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-success mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-success">APworld built successfully!</span>
                  </div>
                  <a
                    href={downloadUrl}
                    download="chatipelago.apworld"
                    className="btn btn-success"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Manual Lists Input */}
        <div className="card bg-base-100 shadow-lg p-6">
          <h3 className="text-lg font-semibold font-bold mb-4">Enter Lists Manually</h3>
          {file && (
            <div className="alert alert-info px-4 py-3  mb-4">
              A YAML file is selected. Remove it to enable manual editing.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label font-semibold">Items (60)</label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="One per line"
                value={itemsText}
                onChange={(e) => {
                  setItemsText(e.target.value)
                  rebuildManualYamlIfApplicable()
                }}
                disabled={!!file}
              />
              <div className="text-xs text-base-content/60 mt-1">{parseLines(itemsText).length} / 60</div>
            </div>

            <div>
              <label className="label font-semibold">Progression Items (3)</label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="One per line"
                value={progItemsText}
                onChange={(e) => {
                  setProgItemsText(e.target.value)
                  rebuildManualYamlIfApplicable()
                }}
                disabled={!!file}
              />
              <div className="text-xs text-base-content/60 mt-1">{parseLines(progItemsText).length} / 3</div>
            </div>

            <div>
              <label className="label font-semibold">Trap Items (3)</label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="One per line"
                value={trapItemsText}
                onChange={(e) => {
                  setTrapItemsText(e.target.value)
                  rebuildManualYamlIfApplicable()
                }}
                disabled={!!file}
              />
              <div className="text-xs text-base-content/60 mt-1">{parseLines(trapItemsText).length} / 3</div>
            </div>

            <div>
              <label className="label font-semibold">Locations (50)</label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="One per line"
                value={locationsText}
                onChange={(e) => {
                  setLocationsText(e.target.value)
                  rebuildManualYamlIfApplicable()
                }}
                disabled={!!file}
              />
              <div className="text-xs text-base-content/60 mt-1">{parseLines(locationsText).length} / 50</div>
            </div>

            <div className="md:col-span-2">
              <label className="label font-semibold">Progression Locations (10)</label>
              <textarea
                className="textarea textarea-bordered w-full h-32"
                placeholder="One per line"
                value={progLocationsText}
                onChange={(e) => {
                  setProgLocationsText(e.target.value)
                  rebuildManualYamlIfApplicable()
                }}
                disabled={!!file}
              />
              <div className="text-xs text-base-content/60 mt-1">{parseLines(progLocationsText).length} / 10</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-base-content/60">
            Paste or drop text into any box. Empty lines are ignored.
          </div>
        </div>
      </div>
    </div>
  )
}
