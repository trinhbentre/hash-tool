import { useRef, useState, useCallback } from 'react'
import { BatchFileTable } from './BatchFileTable'
import { ChecksumVerifier } from './ChecksumVerifier'
import { type Algorithm } from '../lib/hash'
import { type OutputFormat } from '../lib/format'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

interface FileModeProps {
  fileInfo: { fileName: string; size: number } | null
  computing: boolean
  progress: number | null
  error: string
  onFileSelect: (file: File) => void
  algorithm: Algorithm
  format: OutputFormat
}

export function FileMode({ fileInfo, computing, progress, error, onFileSelect, algorithm, format }: FileModeProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [batch, setBatch] = useState<'single' | 'batch' | 'checksum'>('single')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0])
    }
  }, [onFileSelect])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onFileSelect(file)
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Single / Batch / Checksum toggle */}
      <div className="flex gap-1 bg-surface-900 p-1 rounded-lg border border-surface-700 w-fit text-xs">
        {(['single', 'batch', 'checksum'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setBatch(tab)}
            className={`px-3 py-1 rounded-md transition-colors cursor-pointer capitalize ${
              batch === tab ? 'bg-accent text-surface-900 font-semibold' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {batch === 'checksum' ? (
        <ChecksumVerifier />
      ) : batch === 'batch' ? (
        <BatchFileTable algorithm={algorithm} format={format} />
      ) : (
        <>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center gap-3 cursor-pointer transition-colors ${
              isDragging
                ? 'border-accent bg-accent/5 text-accent'
                : 'border-surface-600 hover:border-accent/50 text-text-secondary hover:text-text-primary'
            }`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="text-sm">
              Drop a file here or <span className="text-accent">browse</span>
            </p>
            <p className="text-xs text-text-muted">Processed entirely in your browser — no upload</p>
          </div>
          <input ref={inputRef} type="file" className="hidden" onChange={handleInputChange} />

          {computing && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>Computing hash…</span>
                {progress !== null && <span>{Math.round(progress * 100)}%</span>}
              </div>
              <div className="h-1.5 bg-surface-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-accent rounded-full transition-all duration-150"
                  style={{ width: progress !== null ? `${Math.round(progress * 100)}%` : '100%' }}
                />
              </div>
            </div>
          )}

          {error && !computing && (
            <p className="text-danger text-sm px-1">{error}</p>
          )}

          {fileInfo && !computing && (
            <div className="flex items-center justify-between px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg">
              <span className="text-text-primary text-sm font-medium truncate">{fileInfo.fileName}</span>
              <span className="text-text-muted text-xs shrink-0 ml-3">{formatBytes(fileInfo.size)}</span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
