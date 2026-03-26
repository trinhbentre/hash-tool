import { byteLength } from '../lib/format'
import { detectAlgorithm } from '../lib/detect-algorithm'

interface VerifyModeProps {
  input: string
  onInputChange: (v: string) => void
  expectedHash: string
  onExpectedHashChange: (v: string) => void
  computedHash: string
}

export function VerifyMode({
  input, onInputChange,
  expectedHash, onExpectedHashChange,
  computedHash,
}: VerifyModeProps) {
  const detectedAlg = detectAlgorithm(expectedHash)
  const chars = input.length
  const bytes = byteLength(input)

  const showResult = !!computedHash && !!expectedHash.trim()
  const isMatch = showResult && computedHash.toLowerCase() === expectedHash.trim().toLowerCase()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-text-muted text-xs uppercase tracking-wider">Input Text</label>
        <textarea
          className="min-h-[120px] bg-surface-800 border border-surface-700 rounded-lg p-3
                     font-mono text-sm text-text-primary placeholder-text-muted
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent
                     resize-none"
          placeholder="Type or paste text to verify…"
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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-text-muted text-xs uppercase tracking-wider">Expected Hash</label>
          {detectedAlg && (
            <span className="text-xs text-accent font-mono">{detectedAlg} detected</span>
          )}
          {!detectedAlg && expectedHash.trim() && (
            <span className="text-xs text-warning">Unknown algorithm — paste a hex hash</span>
          )}
        </div>
        <input
          type="text"
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2
                     font-mono text-sm text-text-primary placeholder-text-muted
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
          placeholder="Paste expected hash (hex)…"
          value={expectedHash}
          onChange={e => onExpectedHashChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {showResult && (
        <div className={`flex items-center gap-4 px-5 py-4 rounded-lg border ${
          isMatch
            ? 'bg-success/10 border-success/30 text-success'
            : 'bg-danger/10 border-danger/30 text-danger'
        }`}>
          <span className="text-3xl font-bold">{isMatch ? '✓' : '✗'}</span>
          <div>
            <p className="font-semibold text-base">{isMatch ? 'MATCH' : 'MISMATCH'}</p>
            <p className="text-xs opacity-75">
              {isMatch
                ? 'The hash matches — integrity verified'
                : 'The hash does not match — content may have changed'}
            </p>
          </div>
        </div>
      )}

      {computedHash && (
        <div className="flex flex-col gap-1.5">
          <label className="text-text-muted text-xs uppercase tracking-wider">
            Computed {detectedAlg ?? 'Hash'} (hex)
          </label>
          <div className="bg-surface-800 border border-surface-700 rounded-lg p-3 font-mono text-sm text-text-primary break-all">
            {computedHash}
          </div>
        </div>
      )}
    </div>
  )
}
