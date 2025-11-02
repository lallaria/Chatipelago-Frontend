import { useState, useEffect } from 'react'
import { apiService } from '../services/api'
import { validateMessageTemplate } from '../utils/validation'

export const MessageEditor = () => {
  const [messageFiles, setMessageFiles] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [hasChanges, setHasChanges] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const validVariables = ['{item}', '{player}', '{location}', '{receiver}']

  useEffect(() => {
    loadMessageFiles()
  }, [])

  const loadMessageFiles = async () => {
    try {
      setLoading(true)
      setError(null)
      const files = await apiService.getMessages()
      setMessageFiles(files)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const loadFileContent = async (filename) => {
    try {
      setLoading(true)
      setError(null)
      const content = await apiService.getMessageFile(filename)
      setFileContent(content)
      setSelectedFile(filename)
      setHasChanges(false)
      setValidationErrors([])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleContentChange = (newContent) => {
    setFileContent(newContent)
    setHasChanges(true)
    
    // Validate content
    const validation = validateMessageTemplate(newContent)
    setValidationErrors(validation.errors)
  }

  const handleSave = async () => {
    if (!selectedFile || !fileContent) return

    const validation = validateMessageTemplate(fileContent)
    if (!validation.isValid) {
      setError('Please fix validation errors before saving')
      return
    }

    try {
      setSaving(true)
      setError(null)
      await apiService.updateMessageFile(selectedFile, fileContent)
      setHasChanges(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleRevert = () => {
    if (selectedFile) {
      loadFileContent(selectedFile)
    }
  }

  const addMessage = () => {
    if (!fileContent || !fileContent.messages) {
      setFileContent({ messages: [''] })
    } else {
      setFileContent({
        ...fileContent,
        messages: [...fileContent.messages, '']
      })
    }
    setHasChanges(true)
  }

  const removeMessage = (index) => {
    if (fileContent && fileContent.messages) {
      const newMessages = fileContent.messages.filter((_, i) => i !== index)
      setFileContent({
        ...fileContent,
        messages: newMessages
      })
      setHasChanges(true)
    }
  }

  const updateMessage = (index, value) => {
    if (fileContent && fileContent.messages) {
      const newMessages = [...fileContent.messages]
      newMessages[index] = value
      setFileContent({
        ...fileContent,
        messages: newMessages
      })
      setHasChanges(true)
    }
  }

  // Check if file is object-based (like etc.json) vs array-based (messages)
  const isObjectFile = (content) => {
    if (!content) return false
    if (content.messages && Array.isArray(content.messages)) return false
    return typeof content === 'object' && !Array.isArray(content)
  }

  // Object file handlers (for etc.json)
  const addObjectKey = () => {
    if (!fileContent) {
      setFileContent({})
    } else {
      const newKey = `newKey${Object.keys(fileContent).length + 1}`
      setFileContent({
        ...fileContent,
        [newKey]: ''
      })
    }
    setHasChanges(true)
  }

  const removeObjectKey = (key) => {
    if (fileContent) {
      const newContent = { ...fileContent }
      delete newContent[key]
      setFileContent(newContent)
      setHasChanges(true)
    }
  }

  const updateObjectKey = (oldKey, newKey) => {
    if (fileContent && oldKey !== newKey) {
      const newContent = { ...fileContent }
      const value = newContent[oldKey]
      delete newContent[oldKey]
      newContent[newKey] = value
      setFileContent(newContent)
      setHasChanges(true)
    }
  }

  const updateObjectValue = (key, value) => {
    if (fileContent) {
      setFileContent({
        ...fileContent,
        [key]: value
      })
      setHasChanges(true)
    }
  }

  const filteredFiles = messageFiles.filter(file => 
    file.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !selectedFile) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-lg">Loading message files...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold font-bold mb-2">Message Template Editor</h2>
        <p className="text-base-content/70">Edit chat message templates for different game events</p>
      </div>

      {error && (
        <div className="alert alert-error px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Browser */}
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-lg p-4">
            <h3 className="text-lg font-semibold font-bold mb-4">Message Files</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 input input-bordered focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => loadFileContent(file)}
                    className={`btn btn-sm justify-start w-full ${
                    selectedFile === file
                      ? 'btn-active'
                      : 'btn-ghost'
                  }`}
                >
                  {file.replace('.json', '')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3">
          {selectedFile && fileContent ? (
            <div className="card bg-base-100 shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold font-bold">
                  Editing: {selectedFile}
                </h3>
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <span className="text-sm text-yellow-600">Unsaved changes</span>
                  )}
                  <button
                    onClick={handleRevert}
                    disabled={!hasChanges}
                    className="btn btn-sm btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revert
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges || validationErrors.length > 0}
                    className="btn btn-sm btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="alert alert-error px-4 py-3 rounded mb-4">
                  <h4 className="font-semibold mb-2">Validation Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Render different UI based on file type */}
              {isObjectFile(fileContent) ? (
                /* Object-based file editor (for etc.json) */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold font-bold">Key-Value Pairs</h4>
                    <button
                      onClick={addObjectKey}
                      className="btn btn-sm btn-success"
                    >
                      Add Key
                    </button>
                  </div>

                  {Object.keys(fileContent).map((key) => (
                    <div key={key} className="flex items-start gap-2">
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={key}
                          onChange={(e) => updateObjectKey(key, e.target.value)}
                          className="input input-bordered font-mono text-sm"
                          placeholder="Key name"
                        />
                        <input
                          type="text"
                          value={fileContent[key]}
                          onChange={(e) => updateObjectValue(key, e.target.value)}
                          className="input input-bordered font-mono text-sm"
                          placeholder="Value"
                        />
                      </div>
                      <button
                        onClick={() => removeObjectKey(key)}
                        className="btn btn-sm btn-error"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  {(!fileContent || Object.keys(fileContent).length === 0) && (
                    <div className="text-base-content/60 italic text-center py-4">
                      No keys. Click "Add Key" to get started.
                    </div>
                  )}

                  {/* Live Preview for object files */}
                  {fileContent && Object.keys(fileContent).length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold font-bold mb-2">Live Preview</h4>
                      <div className="card bg-base-200 border border-base-300 p-4">
                        <pre className="font-mono text-sm whitespace-pre-wrap">
                          {JSON.stringify(fileContent, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Array-based file editor (for message templates) */
                <>
                  {/* Template Variables Reference */}
                  <div className="card bg-base-200 border border-base-300 p-4 mb-4">
                    <h4 className="font-semibold font-bold mb-2">Available Template Variables:</h4>
                    <div className="flex flex-wrap gap-2">
                      {validVariables.map((variable) => (
                        <code key={variable} className="bg-base-300 px-2 py-1 rounded text-sm">
                          {variable}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Messages Editor */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold font-bold">Messages</h4>
                      <button
                        onClick={addMessage}
                        className="btn btn-sm btn-success"
                      >
                        Add Message
                      </button>
                    </div>

                    {fileContent.messages && fileContent.messages.map((message, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="flex-1">
                          <textarea
                            value={message}
                            onChange={(e) => updateMessage(index, e.target.value)}
                            className="textarea textarea-bordered w-full font-mono text-sm"
                            rows="2"
                            placeholder="Enter message template..."
                          />
                        </div>
                        <button
                          onClick={() => removeMessage(index)}
                          className="btn btn-sm btn-error"
                        >
                          Remove
                        </button>
                      </div>
                    ))}

                    {(!fileContent.messages || fileContent.messages.length === 0) && (
                      <div className="text-base-content/60 italic text-center py-4">
                        No messages. Click "Add Message" to get started.
                      </div>
                    )}
                  </div>

                  {/* Live Preview */}
                  {fileContent.messages && fileContent.messages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-semibold font-bold mb-2">Live Preview</h4>
                      <div className="card bg-base-200 border border-base-300 p-4">
                        {fileContent.messages.map((message, index) => (
                          <div key={index} className="mb-2 p-2 card bg-base-100 border border-base-300">
                            <div className="text-sm text-base-content/70 mb-1">Message {index + 1}:</div>
                            <div className="font-mono text-sm">
                              {message || <span className="text-base-content/50 italic">Empty message</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="card bg-base-100 shadow-lg p-8 text-center">
              <div className="text-base-content/60">
                {selectedFile ? 'Loading file content...' : 'Select a message file to edit'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
