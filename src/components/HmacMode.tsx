import { TextArea } from '@web-tools/ui'
import { type KeyFormat } from '../lib/hmac'

interface HmacModeProps {
  message: string
  onMessageChange: (v: string) => void
  secretKey: string
  onSecretKeyChange: (v: string) => void
  keyFormat: KeyFormat
  onKeyFormatChange: (fmt: KeyFormat) => void
}

const KEY_FORMATS: { id: KeyFormat; label: string }[] = [
  { id: 'utf8', label: 'UTF-8' },
  { id: 'hex', label: 'Hex' },
  { id: 'base64', label: 'Base64' },
]

export function HmacMode({
  message, onMessageChange,
  secretKey, onSecretKeyChange,
  keyFormat, onKeyFormatChange,
}: HmacModeProps) {
  return (
    <div className="flex flex-col gap-4">
      <TextArea
        label="Message"
        value={message}
        onChange={onMessageChange}
        showByteCount
        placeholder="Type or paste message to authenticate…"
        rows={5}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-text-muted text-xs uppercase tracking-wider">Secret Key</label>
          <div className="flex gap-0.5">
            {KEY_FORMATS.map(kf => (
              <button
                key={kf.id}
                onClick={() => onKeyFormatChange(kf.id)}
                className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                  keyFormat === kf.id
                    ? 'bg-accent/20 text-accent border border-accent/40'
                    : 'text-text-muted hover:text-text-secondary border border-transparent'
                }`}
              >
                {kf.label}
              </button>
            ))}
          </div>
        </div>
        <input
          type="text"
          className="bg-surface-800 border border-surface-700 rounded-lg px-3 py-2
                     font-mono text-sm text-text-primary placeholder-text-muted
                     focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent"
          placeholder={
            keyFormat === 'utf8' ? 'Enter secret key…'
            : keyFormat === 'hex' ? 'Hex-encoded key (e.g. deadbeef)…'
            : 'Base64-encoded key…'
          }
          value={secretKey}
          onChange={e => onSecretKeyChange(e.target.value)}
          spellCheck={false}
        />
      </div>
    </div>
  )
}
