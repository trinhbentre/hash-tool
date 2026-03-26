import { byteLength } from '../lib/format'

interface HashModeProps {
  input: string
  onInputChange: (v: string) => void
}

export function HashMode({ input, onInputChange }: HashModeProps) {
  const chars = input.length
  const bytes = byteLength(input)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-text-muted text-xs uppercase tracking-wider">Input</label>
      <textarea
        className="min-h-[160px] bg-surface-800 border border-surface-700 rounded-lg p-3
                   font-mono text-sm text-text-primary placeholder-text-muted
                   focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent
                   resize-none"
        placeholder="Type or paste text to hash…"
        value={input}
        onChange={e => onInputChange(e.target.value)}
        spellCheck={false}
      />
      {input && (
        <p className="text-text-muted text-xs">
          {chars.toLocaleString()} character{chars !== 1 ? 's' : ''} · {bytes.toLocaleString()} byte{bytes !== 1 ? 's' : ''} (UTF-8)
        </p>
      )}
    </div>
  )
}
