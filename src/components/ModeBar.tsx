import { ModeSelector } from '@web-tools/ui'

export type Mode = 'hash' | 'hmac' | 'verify' | 'file' | 'compare'

const MODES: { id: Mode; label: string }[] = [
  { id: 'hash', label: 'Hash' },
  { id: 'hmac', label: 'HMAC' },
  { id: 'verify', label: 'Verify' },
  { id: 'file', label: 'File' },
  { id: 'compare', label: 'Compare' },
]

interface ModeBarProps {
  mode: Mode
  onModeChange: (mode: Mode) => void
}

export function ModeBar({ mode, onModeChange }: ModeBarProps) {
  return (
    <ModeSelector
      options={MODES}
      activeId={mode}
      onChange={id => onModeChange(id as Mode)}
      variant="pill"
      aria-label="Select mode"
    />
  )
}
