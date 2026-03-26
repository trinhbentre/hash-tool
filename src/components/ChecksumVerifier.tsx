import { useState, useCallback } from 'react'
import { parseChecksumFile, detectAlgorithmFromHashLength, type ChecksumEntry } from '../lib/checksum-parser'
import { computeHash } from '../lib/hash'
import { type OutputFormat } from '../lib/format'

interface VerifyResult {
  entry: ChecksumEntry
  computedHash: string | null
  status: 'pending' | 'computing' | 'pass' | 'fail' | 'error'
  error?: string
}

export function ChecksumVerifier() {
  const [entries, setEntries] = useState<ChecksumEntry[]>([])
  const [results, setResults] = useState<Map<string, VerifyResult>>(new Map())
  const [checksumLoaded, setChecksumLoaded] = useState(false)
  const [isDraggingChecksum, setIsDraggingChecksum] = useState(false)
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const [parseError, setParseError] = useState('')

  const loadChecksumFile = useCallback(async (file: File) => {
    setParseError('')
    if (file.size > 1024 * 1024) {
      setParseError('Checksum file too large (max 1 MB)')
      return
    }
    const text = await file.text()
    const parsed = parseChecksumFile(text)
    if (parsed.length === 0) {
      setParseError('No valid checksum entries found. Expected format: "<hash>  <filename>"')
      return
    }
    setEntries(parsed)
    const initial = new Map<string, VerifyResult>()
    parsed.forEach(e => initial.set(e.filename, { entry: e, computedHash: null, status: 'pending' }))
    setResults(initial)
    setChecksumLoaded(true)
  }, [])

  const verifyFiles = useCallback(async (files: File[]) => {
    for (const file of files) {
      const matched = entries.find(e => e.filename === file.name || e.filename.split('/').pop() === file.name)
      if (!matched) continue

      setResults(prev => {
        const next = new Map(prev)
        const r = next.get(matched.filename)
        if (r) next.set(matched.filename, { ...r, status: 'computing' })
        return next
      })

      try {
        const algorithm = detectAlgorithmFromHashLength(matched.hash)
        if (!algorithm) throw new Error(`Unrecognized hash length (${matched.hash.length} chars)`)
        if (file.size > 512 * 1024 * 1024) {
          throw new Error('File too large for checksum verifier (max 512 MB). Use Single file mode for large files.')
        }
        const buf = await file.arrayBuffer()
        const computedHash = await computeHash(algorithm as Parameters<typeof computeHash>[0], buf, 'hex' as OutputFormat)
        const isMatch = computedHash.toLowerCase() === matched.hash.toLowerCase()
        setResults(prev => {
          const next = new Map(prev)
          next.set(matched.filename, { entry: matched, computedHash, status: isMatch ? 'pass' : 'fail' })
          return next
        })
      } catch (err) {
        setResults(prev => {
          const next = new Map(prev)
          next.set(matched.filename, {
            entry: matched,
            computedHash: null,
            status: 'error',
            error: err instanceof Error ? err.message : 'Error',
          })
          return next
        })
      }
    }
  }, [entries])

  const handleChecksumDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingChecksum(false)
    const file = e.dataTransfer.files[0]
    if (file) loadChecksumFile(file)
  }

  const handleFilesDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFiles(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) verifyFiles(files)
  }

  const reset = () => {
    setEntries([])
    setResults(new Map())
    setChecksumLoaded(false)
    setParseError('')
  }

  if (!checksumLoaded) {
    return (
      <div className="flex flex-col gap-4">
        <div
          onDrop={handleChecksumDrop}
          onDragOver={e => { e.preventDefault(); setIsDraggingChecksum(true) }}
          onDragLeave={() => setIsDraggingChecksum(false)}
          onClick={() => document.getElementById('checksum-input')?.click()}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer transition-colors ${
            isDraggingChecksum
              ? 'border-accent bg-accent/5 text-accent'
              : 'border-surface-600 hover:border-accent/50 text-text-secondary'
          }`}
        >
          <p className="text-sm font-medium">Drop a checksum file here</p>
          <p className="text-xs text-text-muted">.sha256sum · .sha512sum · .md5sum · .sha1sum</p>
          <label className="text-accent text-xs cursor-pointer hover:text-accent-hover">
            or browse
            <input
              id="checksum-input"
              type="file"
              className="hidden"
              accept=".sha256sum,.sha512sum,.md5sum,.sha1sum,.txt,text/plain"
              onChange={e => { const f = e.target.files?.[0]; if (f) loadChecksumFile(f); e.target.value = '' }}
            />
          </label>
        </div>
        {parseError && <p className="text-danger text-xs">{parseError}</p>}
        <p className="text-text-muted text-xs text-center">
          Format: <code className="font-mono bg-surface-700 px-1 rounded">{'<hash>  <filename>'}</code> (shasum / openssl standard)
        </p>
      </div>
    )
  }

  const allResults = entries.map(e => results.get(e.filename)!)
  const totalVerified = allResults.filter(r => r.status === 'pass' || r.status === 'fail').length
  const totalPass = allResults.filter(r => r.status === 'pass').length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-text-secondary text-sm">{entries.length} entries loaded</span>
          {totalVerified > 0 && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${
              totalPass === totalVerified ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
            }`}>
              {totalPass}/{totalVerified} verified
            </span>
          )}
        </div>
        <button
          onClick={reset}
          className="text-xs text-text-muted hover:text-danger transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>

      {/* Drop zone for actual files */}
      <div
        onDrop={handleFilesDrop}
        onDragOver={e => { e.preventDefault(); setIsDraggingFiles(true) }}
        onDragLeave={() => setIsDraggingFiles(false)}
        onClick={() => document.getElementById('verify-files-input')?.click()}
        className={`border-2 border-dashed rounded-lg p-5 flex flex-col items-center gap-1.5 cursor-pointer transition-colors ${
          isDraggingFiles
            ? 'border-accent bg-accent/5 text-accent'
            : 'border-surface-600 hover:border-accent/50 text-text-secondary'
        }`}
      >
        <p className="text-sm">Drop files to verify</p>
        <p className="text-xs text-text-muted">Files are matched by name against the checksum list</p>
        <input
          id="verify-files-input"
          type="file"
          multiple
          className="hidden"
          onChange={e => { verifyFiles(Array.from(e.target.files ?? [])); e.target.value = '' }}
        />
      </div>

      {/* Results table */}
      <div className="border border-surface-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-surface-700 bg-surface-800">
              <th className="text-left text-text-muted text-xs font-medium px-3 py-2">File</th>
              <th className="text-left text-text-muted text-xs font-medium px-3 py-2 w-24">Status</th>
              <th className="text-left text-text-muted text-xs font-medium px-3 py-2 hidden sm:table-cell">Expected</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-700">
            {entries.map(entry => {
              const r = results.get(entry.filename)!
              return (
                <tr key={entry.filename} className="bg-surface-900">
                  <td className="px-3 py-2 text-text-primary text-xs truncate max-w-0 w-1/2">
                    <span className="block truncate">{entry.filename}</span>
                  </td>
                  <td className="px-3 py-2 w-24">
                    {r.status === 'pending' && <span className="text-text-muted text-xs">Waiting…</span>}
                    {r.status === 'computing' && <span className="text-text-muted text-xs">Checking…</span>}
                    {r.status === 'pass' && <span className="text-success text-xs font-semibold">✓ PASS</span>}
                    {r.status === 'fail' && <span className="text-danger text-xs font-semibold">✗ FAIL</span>}
                    {r.status === 'error' && <span className="text-warning text-xs">{r.error}</span>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-text-muted truncate hidden sm:table-cell">
                    {entry.hash.slice(0, 16)}…
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
