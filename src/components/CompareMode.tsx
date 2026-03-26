interface CompareModeProps {
  hashA: string
  onHashAChange: (v: string) => void
  hashB: string
  onHashBChange: (v: string) => void
}

export function CompareMode({ hashA, onHashAChange, hashB, onHashBChange }: CompareModeProps) {
  const canCompare = hashA.trim() !== '' && hashB.trim() !== ''
  const isMatch = canCompare && hashA.trim().toLowerCase() === hashB.trim().toLowerCase()

  const renderDiff = () => {
    const a = hashA.trim().toLowerCase()
    const b = hashB.trim().toLowerCase()
    const maxLen = Math.max(a.length, b.length)

    return (
      <div className="flex flex-col gap-2">
        <div className="font-mono text-sm leading-relaxed break-all">
          {Array.from({ length: maxLen }).map((_, i) => {
            const ca = a[i] ?? ''
            const cb = b[i] ?? ''
            const match = ca === cb
            return (
              <span
                key={i}
                className={match ? 'text-text-primary' : 'bg-danger/20 text-danger rounded-sm'}
              >
                {a[i] ?? <span className="opacity-40">·</span>}
              </span>
            )
          })}
        </div>
        <div className="font-mono text-sm leading-relaxed break-all">
          {Array.from({ length: maxLen }).map((_, i) => {
            const ca = a[i] ?? ''
            const cb = b[i] ?? ''
            const match = ca === cb
            return (
              <span
                key={i}
                className={match ? 'text-text-primary' : 'bg-danger/20 text-danger rounded-sm'}
              >
                {b[i] ?? <span className="opacity-40">·</span>}
              </span>
            )
          })}
        </div>
      </div>
    )
  }

  const mismatchCount = (() => {
    if (!canCompare) return 0
    const a = hashA.trim().toLowerCase()
    const b = hashB.trim().toLowerCase()
    const maxLen = Math.max(a.length, b.length)
    let count = 0
    for (let i = 0; i < maxLen; i++) {
      if (a[i] !== b[i]) count++
    }
    return count
  })()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-text-muted text-xs uppercase tracking-wider">Hash A</label>
        <input
          type="text"
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2
                     font-mono text-sm text-text-primary placeholder-text-muted
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
          placeholder="Paste first hash…"
          value={hashA}
          onChange={e => onHashAChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-text-muted text-xs uppercase tracking-wider">Hash B</label>
        <input
          type="text"
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2
                     font-mono text-sm text-text-primary placeholder-text-muted
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
          placeholder="Paste second hash…"
          value={hashB}
          onChange={e => onHashBChange(e.target.value)}
          spellCheck={false}
        />
      </div>

      {canCompare && (
        <>
          <div className={`flex items-center gap-4 px-5 py-4 rounded-lg border ${
            isMatch
              ? 'bg-success/10 border-success/30 text-success'
              : 'bg-danger/10 border-danger/30 text-danger'
          }`}>
            <span className="text-3xl font-bold">{isMatch ? '✓' : '✗'}</span>
            <div>
              <p className="font-semibold text-base">{isMatch ? 'IDENTICAL' : 'DIFFERENT'}</p>
              <p className="text-xs opacity-75">
                {isMatch
                  ? 'Both hashes are identical'
                  : `${mismatchCount} character${mismatchCount !== 1 ? 's' : ''} differ`}
              </p>
            </div>
          </div>

          {!isMatch && (
            <div className="flex flex-col gap-2 bg-surface-800 border border-surface-700 rounded-lg p-4">
              <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Character diff</p>
              {renderDiff()}
            </div>
          )}
        </>
      )}
    </div>
  )
}
