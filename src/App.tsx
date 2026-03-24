import { useState, useEffect, useRef } from 'react'
import { Header } from './components/Header'

type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'

const ALGORITHMS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']

async function computeHash(algorithm: Algorithm, message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest(algorithm, msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export default function App() {
  const [input, setInput] = useState('')
  const [algorithm, setAlgorithm] = useState<Algorithm>('SHA-256')
  const [hash, setHash] = useState('')
  const [copied, setCopied] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!input) { setHash(''); return }
    debounceRef.current = setTimeout(() => {
      computeHash(algorithm, input).then(setHash)
    }, 200)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [input, algorithm])

  const handleCopy = () => {
    if (!hash) return
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        {/* Algorithm tabs */}
        <div className="flex gap-1 flex-wrap">
          {ALGORITHMS.map(alg => (
            <button
              key={alg}
              onClick={() => setAlgorithm(alg)}
              className={`px-3 py-1.5 rounded-md text-sm font-mono transition-colors duration-150 cursor-pointer ${
                algorithm === alg
                  ? 'bg-accent text-surface-900 font-semibold'
                  : 'bg-surface-700 text-text-secondary border border-surface-600 hover:bg-surface-600'
              }`}
            >
              {alg}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-text-muted text-xs uppercase tracking-wider">Input</label>
          <textarea
            className="min-h-[160px] bg-surface-800 border border-surface-700 rounded-lg p-3
                       font-mono text-sm text-text-primary placeholder-text-muted
                       focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent
                       resize-none"
            placeholder="Type or paste text to hash…"
            value={input}
            onChange={e => setInput(e.target.value)}
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-text-muted text-xs uppercase tracking-wider">{algorithm} Hash</label>
            <button
              className="text-xs text-text-secondary hover:text-accent transition-colors disabled:opacity-40 cursor-pointer"
              onClick={handleCopy}
              disabled={!hash}
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <div
            className="bg-surface-800 border border-surface-700 rounded-lg p-3
                       font-mono text-sm text-text-primary break-all min-h-[52px]
                       flex items-center"
          >
            {hash || <span className="text-text-muted">Hash will appear here…</span>}
          </div>
        </div>

        <p className="text-text-muted text-xs text-center">
          Computed in-browser using the Web Crypto API — no data is sent to any server
        </p>
      </main>
    </div>
  )
}
