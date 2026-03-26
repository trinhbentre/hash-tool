export function Header() {
  return (
    <header className="h-11 flex items-center px-4 gap-3 border-b border-surface-700 bg-surface-800 shadow-[0_1px_8px_rgba(0,0,0,0.4)] shrink-0">
      {/* Home link */}
      <a
        href="https://trinhbentre.github.io/"
        className="flex-shrink-0 text-text-muted hover:text-accent transition-colors"
        title="Back to homepage"
        aria-label="Back to homepage"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      </a>

      {/* Divider */}
      <div className="w-px h-5 bg-surface-600 flex-shrink-0" />

      {/* Brand */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <svg className="w-4 h-4 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4"  y1="9"  x2="20" y2="9" />
          <line x1="4"  y1="15" x2="20" y2="15" />
          <line x1="10" y1="3"  x2="8"  y2="21" />
          <line x1="16" y1="3"  x2="14" y2="21" />
        </svg>
        <span className="font-semibold tracking-tight text-sm text-text-primary">HASH PRO TOOL</span>
        <span className="text-[10px] text-success/70 border border-success/20 rounded px-1.5 py-0.5 leading-none">🔒 Client-side</span>
      </div>
    </header>
  )
}
