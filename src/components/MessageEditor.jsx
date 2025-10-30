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

  const validVariables = ['{item}', '{player}', '{location}', '{count}', '{time}']

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Message Template Editor</h2>
        <p className="text-gray-600">Edit chat message templates for different game events</p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Browser */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Files</h3>
            
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              {filteredFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => loadFileContent(file)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    selectedFile === file
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'hover:bg-gray-100 text-gray-700'
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
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Editing: {selectedFile}
                </h3>
                <div className="flex items-center space-x-2">
                  {hasChanges && (
                    <span className="text-sm text-yellow-600">Unsaved changes</span>
                  )}
                  <button
                    onClick={handleRevert}
                    disabled={!hasChanges}
                    className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Revert
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges || validationErrors.length > 0}
                    className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  <h4 className="font-semibold mb-2">Validation Errors:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Template Variables Reference */}
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">Available Template Variables:</h4>
                <div className="flex flex-wrap gap-2">
                  {validVariables.map((variable) => (
                    <code key={variable} className="bg-gray-200 px-2 py-1 rounded text-sm">
                      {variable}
                    </code>
                  ))}
                </div>
              </div>

              {/* Messages Editor */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">Messages</h4>
                  <button
                    onClick={addMessage}
                    className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        rows="2"
                        placeholder="Enter message template..."
                      />
                    </div>
                    <button
                      onClick={() => removeMessage(index)}
                      className="px-2 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                {(!fileContent.messages || fileContent.messages.length === 0) && (
                  <div className="text-gray-500 italic text-center py-4">
                    No messages. Click "Add Message" to get started.
                  </div>
                )}
              </div>

              {/* Live Preview */}
              {fileContent.messages && fileContent.messages.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Live Preview</h4>
                  <div className="bg-gray-100 border border-gray-200 rounded-md p-4">
                    {fileContent.messages.map((message, index) => (
                      <div key={index} className="mb-2 p-2 bg-white rounded border">
                        <div className="text-sm text-gray-600 mb-1">Message {index + 1}:</div>
                        <div className="font-mono text-sm">
                          {message || <span className="text-gray-400 italic">Empty message</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="text-gray-500">
                {selectedFile ? 'Loading file content...' : 'Select a message file to edit'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
