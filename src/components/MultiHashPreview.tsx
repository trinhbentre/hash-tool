import { useState, useEffect } from 'react'
import { type Algorithm, computeHash } from '../lib/hash'
import { type OutputFormat } from '../lib/format'

const ALL_ALGORITHMS: Algorithm[] = [
  'SHA-1', 'SHA-256', 'SHA-384', 'SHA-512',
  'SHA3-256', 'SHA3-512',
  'MD5', 'CRC32',
]

interface MultiHashPreviewProps {
  input: string
  format: OutputFormat
}

export function MultiHashPreview({ input, format }: MultiHashPreviewProps) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!open || !input) {
      setResults({})
      return
    }
    const compute = async () => {
      const entries = await Promise.all(
        ALL_ALGORITHMS.map(async alg => {
          const hash = await computeHash(alg, input, format)
          return [alg, hash] as const
        })
      )
      setResults(Object.fromEntries(entries))
    }
    compute()
  }, [open, input, format])

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-800 hover:bg-surface-700 transition-colors text-sm text-text-secondary cursor-pointer"
      >
        <span>All algorithms</span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="divide-y divide-surface-700">
          {ALL_ALGORITHMS.map(alg => (
            <div key={alg} className="flex items-start gap-3 px-4 py-2.5 bg-surface-900">
              <span className="text-text-muted text-xs font-mono w-20 shrink-0 pt-0.5">{alg}</span>
              <span className="font-mono text-xs text-text-primary break-all">
                {results[alg] ?? <span className="text-text-muted">—</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
