export type Mode = 'hash' | 'hmac' | 'verify' | 'file' | 'compare'

interface ModeBarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

const MODES: { id: Mode; label: string }[] = [
  { id: 'hash', label: 'Hash' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'verify', label: 'Verify' },
  { id: 'file', label: 'File' },
  { id: 'compare', label: 'Compare' },
]

export function ModeBar({ mode, onModeChange }: ModeBarProps) {
  return (
    <div className="flex gap-1 bg-surface-900 p-1 rounded-lg border border-surface-700 w-fit">
      {MODES.map(m => (
        <button
          key={m.id}
          onClick={() => onModeChange(m.id)}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors duration-150 cursor-pointer ${
            mode === m.id
              ? 'bg-accent text-surface-900 font-semibold'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  )
}
