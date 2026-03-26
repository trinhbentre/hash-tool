import { useState } from 'react'

export interface HistoryEntry {
  id: number
  mode: string
  algorithm: string
  input: string
  result: string
  timestamp: number
}

interface HashHistoryProps {
  entries: HistoryEntry[]
  onClear: () => void
  onRestore: (entry: HistoryEntry) => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function truncate(s: string, max = 40): string {
  return s.length > max ? s.slice(0, max) + '…' : s
}

export function HashHistory({ entries, onClear, onRestore }: HashHistoryProps) {
  const [open, setOpen] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-800 hover:bg-surface-700 transition-colors cursor-pointer"
      >
        <span className="text-text-secondary text-sm">
          History <span className="text-text-muted text-xs ml-1">({entries.length})</span>
        </span>
        <div className="flex items-center gap-3">
          {open && (
            <span
              className="text-xs text-text-muted hover:text-danger transition-colors"
              onClick={e => { e.stopPropagation(); onClear() }}
            >
              Clear all
            </span>
          )}
          <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div className="divide-y divide-surface-700 max-h-64 overflow-y-auto">
          {entries.map(entry => (
            <button
              key={entry.id}
              onClick={() => onRestore(entry)}
              className="w-full flex items-start gap-3 px-4 py-2.5 bg-surface-900 hover:bg-surface-800 transition-colors text-left cursor-pointer"
            >
              <span className="text-text-muted text-xs w-14 shrink-0 pt-0.5">{formatTime(entry.timestamp)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs text-accent font-mono">{entry.algorithm}</span>
                  <span className="text-xs text-text-muted capitalize">{entry.mode}</span>
                </div>
                <p className="text-xs text-text-secondary truncate">{truncate(entry.input)}</p>
                <p className="text-xs text-text-muted font-mono truncate">{truncate(entry.result, 48)}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
