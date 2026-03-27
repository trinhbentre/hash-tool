import { CopyButton } from '@web-tools/ui'
import { type OutputFormat } from '../lib/format'

interface OutputDisplayProps {
  label: string
  value: string
  format: OutputFormat
  onFormatChange: (fmt: OutputFormat) => void
  placeholder?: string
}

const FORMATS: OutputFormat[] = ['hex', 'HEX', 'base64']

export function OutputDisplay({ label, value, format, onFormatChange, placeholder }: OutputDisplayProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-text-muted text-xs uppercase tracking-wider">{label}</label>
          <div className="flex gap-0.5">
            {FORMATS.map(fmt => (
              <button
                key={fmt}
                onClick={() => onFormatChange(fmt)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  format === fmt
                    ? 'bg-accent/20 text-accent border border-accent/40'
                    : 'text-text-muted hover:text-text-secondary border border-transparent'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>
        <CopyButton value={value} size="sm" />
      </div>
      <div
        className="bg-surface-800 border border-surface-700 rounded-lg p-3
                   font-mono text-sm text-text-primary break-all min-h-[52px]
                   flex items-center"
      >
        {value || <span className="text-text-muted">{placeholder ?? 'Hash will appear here…'}</span>}
      </div>
    </div>
  )
}
