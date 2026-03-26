import { useState, useCallback } from 'react'
import { type Algorithm } from '../lib/hash'
import { type OutputFormat } from '../lib/format'
import { computeHash } from '../lib/hash'

const STREAM_THRESHOLD = 256 * 1024 * 1024 // 256 MB

async function hashFile(algorithm: Algorithm, file: File, format: OutputFormat): Promise<string> {
  if (file.size > STREAM_THRESHOLD) {
    throw new Error(`File too large for batch mode (max 256 MB per file). Use Single mode for large files.`)
  }
  const buf = await file.arrayBuffer()
  return computeHash(algorithm, buf, format)
}

interface BatchFileEntry {
  fileName: string
  size: number
  hash: string
  status: 'computing' | 'done' | 'error'
  error?: string
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

interface BatchFileTableProps {
  algorithm: Algorithm
  format: OutputFormat
}

export function BatchFileTable({ algorithm, format }: BatchFileTableProps) {
  const [entries, setEntries] = useState<BatchFileEntry[]>([])
  const [isDragging, setIsDragging] = useState(false)

  const processFiles = useCallback(async (files: File[]) => {
    const newEntries: BatchFileEntry[] = files.map(f => ({
      fileName: f.name,
      size: f.size,
      hash: '',
      status: 'computing' as const,
    }))
    setEntries(prev => [...prev, ...newEntries])

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const globalIndex = entries.length + i
      try {
        const hash = await hashFile(algorithm, file, format)
        setEntries(prev =>
          prev.map((e, idx) =>
            idx === globalIndex ? { ...e, hash, status: 'done' } : e
          )
        )
      } catch (err) {
        setEntries(prev =>
          prev.map((e, idx) =>
            idx === globalIndex
              ? { ...e, status: 'error', error: err instanceof Error ? err.message : 'Error' }
              : e
          )
        )
      }
    }
  }, [algorithm, format, entries.length])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) processFiles(files)
  }, [processFiles])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length > 0) processFiles(files)
    e.target.value = ''
  }

  const exportChecksums = () => {
    const lines = entries
      .filter(e => e.status === 'done')
      .map(e => `${e.hash}  ${e.fileName}`)
      .join('\n')
    const blob = new Blob([lines + '\n'], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `checksums.${algorithm.toLowerCase().replace(/-/g, '')}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAll = () => setEntries([])

  return (
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-2 transition-colors ${
          isDragging
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-surface-600 hover:border-accent/50 text-text-secondary'
        }`}
      >
        <p className="text-sm">Drop multiple files here</p>
        <label className="text-accent text-sm cursor-pointer hover:text-accent-hover">
          or browse files
          <input type="file" multiple className="hidden" onChange={handleFileInput} />
        </label>
        <p className="text-xs text-text-muted">Processed entirely in your browser — no upload</p>
      </div>

      {entries.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-text-muted text-xs">{entries.length} file{entries.length !== 1 ? 's' : ''}</span>
            <div className="flex gap-2">
              <button
                onClick={exportChecksums}
                disabled={entries.every(e => e.status !== 'done')}
                className="text-xs px-3 py-1 rounded border border-surface-600 text-text-secondary hover:text-accent hover:border-accent/50 transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                Export checksums
              </button>
              <button
                onClick={clearAll}
                className="text-xs px-3 py-1 rounded border border-surface-600 text-text-secondary hover:text-danger hover:border-danger/50 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="border border-surface-700 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-700 bg-surface-800">
                  <th className="text-left text-text-muted text-xs font-medium px-3 py-2 w-1/3">File</th>
                  <th className="text-right text-text-muted text-xs font-medium px-3 py-2 w-20">Size</th>
                  <th className="text-left text-text-muted text-xs font-medium px-3 py-2">Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700">
                {entries.map((entry, i) => (
                  <tr key={i} className="bg-surface-900">
                    <td className="px-3 py-2 text-text-primary truncate max-w-0 w-1/3">
                      <span className="block truncate">{entry.fileName}</span>
                    </td>
                    <td className="px-3 py-2 text-text-muted text-right text-xs">{formatBytes(entry.size)}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {entry.status === 'computing' && (
                        <span className="text-text-muted">Computing…</span>
                      )}
                      {entry.status === 'done' && (
                        <span className="text-text-primary break-all">{entry.hash}</span>
                      )}
                      {entry.status === 'error' && (
                        <span className="text-danger">{entry.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
