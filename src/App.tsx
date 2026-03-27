import { useState, useEffect, useRef, useCallback } from 'react'
import { Header } from './components/Header'
import { ModeBar, type Mode } from './components/ModeBar'
import { AlgorithmPicker } from './components/AlgorithmPicker'
import { OutputDisplay } from './components/OutputDisplay'
import { HashMode } from './components/HashMode'
import { HmacMode } from './components/HmacMode'
import { VerifyMode } from './components/VerifyMode'
import { FileMode } from './components/FileMode'
import { CompareMode } from './components/CompareMode'
import { MultiHashPreview } from './components/MultiHashPreview'
import { HashHistory, type HistoryEntry } from './components/HashHistory'
import { CopyAsCode } from './components/CopyAsCode'
import { type Algorithm, computeHash, type HmacAlgorithm } from './lib/hash'
import { type KeyFormat, computeHmac } from './lib/hmac'
import { type OutputFormat } from './lib/format'
import { detectAlgorithm } from './lib/detect-algorithm'
import { useStorage } from '@web-tools/ui'
import { useHashWorker } from './hooks/useHashWorker'

const MAX_HISTORY = 20
let historyIdCounter = 0

export default function App() {
  const [mode, setMode] = useStorage<Mode>('hash-pro-mode', 'hash')
  const [algorithm, setAlgorithm] = useStorage<Algorithm>('hash-pro-algorithm', 'SHA-256')
  const [format, setFormat] = useStorage<OutputFormat>('hash-pro-format', 'hex')

  const { hashInWorker } = useHashWorker()

  // Hash mode
  const [hashInput, setHashInput] = useState('')
  const [hashResult, setHashResult] = useState('')

  // HMAC mode
  const [hmacMessage, setHmacMessage] = useState('')
  const [hmacSecret, setHmacSecret] = useState('')
  const [hmacKeyFormat, setHmacKeyFormat] = useState<KeyFormat>('utf8')
  const [hmacResult, setHmacResult] = useState('')
  const [hmacError, setHmacError] = useState('')

  // Verify mode
  const [verifyInput, setVerifyInput] = useState('')
  const [verifyExpected, setVerifyExpected] = useState('')
  const [verifyComputedHash, setVerifyComputedHash] = useState('')

  // File mode
  const [fileInfo, setFileInfo] = useState<{ fileName: string; size: number } | null>(null)
  const [fileHash, setFileHash] = useState('')
  const [fileComputing, setFileComputing] = useState(false)
  const [fileProgress, setFileProgress] = useState<number | null>(null)
  const [fileError, setFileError] = useState('')

  // Compare mode
  const [compareHashA, setCompareHashA] = useState('')
  const [compareHashB, setCompareHashB] = useState('')

  // History (in-memory)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const hashDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hmacDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)
  const verifyDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const addHistory = useCallback((entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => {
    setHistory(prev => {
      const newEntry: HistoryEntry = { ...entry, id: ++historyIdCounter, timestamp: Date.now() }
      return [newEntry, ...prev].slice(0, MAX_HISTORY)
    })
  }, [])

  // Hash mode computation
  useEffect(() => {
    if (hashDebounce.current) clearTimeout(hashDebounce.current)
    if (!hashInput) { setHashResult(''); return }
    hashDebounce.current = setTimeout(() => {
      computeHash(algorithm, hashInput, format).then(result => {
        setHashResult(result)
        addHistory({ mode: 'hash', algorithm, input: hashInput, result })
      })
    }, 200)
    return () => { if (hashDebounce.current) clearTimeout(hashDebounce.current) }
  }, [hashInput, algorithm, format, addHistory])

  // HMAC mode computation
  useEffect(() => {
    if (mode !== 'hmac') return
    if (hmacDebounce.current) clearTimeout(hmacDebounce.current)
    if (!hmacMessage || !hmacSecret) { setHmacResult(''); setHmacError(''); return }
    hmacDebounce.current = setTimeout(async () => {
      try {
        const result = await computeHmac(effectiveAlgorithm as HmacAlgorithm, hmacMessage, hmacSecret, hmacKeyFormat, format)
        setHmacResult(result)
        setHmacError('')
        addHistory({ mode: 'hmac', algorithm, input: hmacMessage, result })
      } catch (e) {
        setHmacResult('')
        setHmacError(e instanceof Error ? e.message : 'Invalid key format')
      }
    }, 200)
    return () => { if (hmacDebounce.current) clearTimeout(hmacDebounce.current) }
  // effectiveAlgorithm is derived from algorithm — only algorithm needed in deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hmacMessage, hmacSecret, hmacKeyFormat, algorithm, format, mode, addHistory])

  // Verify mode computation
  const verifyDetectedAlg = detectAlgorithm(verifyExpected)
  useEffect(() => {
    if (mode !== 'verify') return
    if (verifyDebounce.current) clearTimeout(verifyDebounce.current)
    if (!verifyInput || !verifyDetectedAlg) { setVerifyComputedHash(''); return }
    verifyDebounce.current = setTimeout(() => {
      computeHash(verifyDetectedAlg, verifyInput, 'hex').then(setVerifyComputedHash)
    }, 200)
    return () => { if (verifyDebounce.current) clearTimeout(verifyDebounce.current) }
  }, [verifyInput, verifyDetectedAlg, mode])

  // Clear stale file result when algorithm or format changes
  useEffect(() => {
    setFileInfo(null)
    setFileHash('')
  }, [algorithm, format])

  // Keyboard shortcuts: Cmd/Ctrl+L = clear, Cmd/Ctrl+Shift+C = copy current result
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'l') {
        e.preventDefault()
        setHashInput('')
        setHmacMessage('')
        setHmacSecret('')
        setVerifyInput('')
        setVerifyExpected('')
        setCompareHashA('')
        setCompareHashB('')
      }
      if (mod && e.shiftKey && e.key === 'C') {
        e.preventDefault()
        const val = mode === 'hash' ? hashResult
          : mode === 'hmac' ? hmacResult
          : mode === 'file' ? fileHash
          : ''
        if (val) navigator.clipboard.writeText(val)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [mode, hashResult, hmacResult, fileHash])

  // HMAC mode: auto-clamp to valid HMAC algorithm
  const effectiveAlgorithm: Algorithm = (() => {
    if (mode === 'hmac') {
      const hmacAlgos = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'MD5']
      return hmacAlgos.includes(algorithm) ? algorithm : 'SHA-256'
    }
    return algorithm
  })()

  const handleFileSelect = useCallback(async (file: File) => {
    setFileComputing(true)
    setFileInfo(null)
    setFileHash('')
    setFileError('')
    setFileProgress(0)
    try {
      // Pass File directly — worker streams it in 64 MB chunks, no main-thread memory spike
      const hash = await hashInWorker(effectiveAlgorithm, file, format, setFileProgress)
      setFileInfo({ fileName: file.name, size: file.size })
      setFileHash(hash)
      addHistory({ mode: 'file', algorithm: effectiveAlgorithm, input: file.name, result: hash })
    } catch (err) {
      setFileError(err instanceof Error ? err.message : 'Failed to hash file')
    } finally {
      setFileComputing(false)
      setFileProgress(null)
    }
  }, [effectiveAlgorithm, format, hashInWorker, addHistory])

  const handleRestoreHistory = useCallback((entry: HistoryEntry) => {
    setMode(entry.mode as Mode)
    setAlgorithm(entry.algorithm as Algorithm)
    if (entry.mode === 'hash') setHashInput(entry.input)
    else if (entry.mode === 'hmac') setHmacMessage(entry.input)
  }, [setMode, setAlgorithm])

  const outputLabel = mode === 'hmac' ? `HMAC-${algorithm}` : `${algorithm} Hash`
  const outputValue = mode === 'hash' ? hashResult : mode === 'hmac' ? hmacResult : fileHash

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <ModeBar mode={mode} onModeChange={setMode} />

        {mode !== 'verify' && mode !== 'compare' && (
          <AlgorithmPicker
            algorithm={effectiveAlgorithm}
            onAlgorithmChange={setAlgorithm}
            hmacOnly={mode === 'hmac'}
          />
        )}

        {mode === 'hash' && (
          <HashMode input={hashInput} onInputChange={setHashInput} />
        )}
        {mode === 'hmac' && (
          <HmacMode
            message={hmacMessage} onMessageChange={setHmacMessage}
            secretKey={hmacSecret} onSecretKeyChange={setHmacSecret}
            keyFormat={hmacKeyFormat} onKeyFormatChange={setHmacKeyFormat}
          />
        )}
        {mode === 'verify' && (
          <VerifyMode
            input={verifyInput} onInputChange={setVerifyInput}
            expectedHash={verifyExpected} onExpectedHashChange={setVerifyExpected}
            computedHash={verifyComputedHash}
          />
        )}
        {mode === 'file' && (
          <FileMode
            fileInfo={fileInfo}
            computing={fileComputing}
            progress={fileProgress}
            error={fileError}
            onFileSelect={handleFileSelect}
            algorithm={effectiveAlgorithm}
            format={format}
          />
        )}
        {mode === 'compare' && (
          <CompareMode
            hashA={compareHashA} onHashAChange={setCompareHashA}
            hashB={compareHashB} onHashBChange={setCompareHashB}
          />
        )}

        {mode !== 'verify' && mode !== 'compare' && (
          <>
            {hmacError && mode === 'hmac' && (
              <p className="text-danger text-xs -mt-3">{hmacError}</p>
            )}
            {mode !== 'file' && (
              <OutputDisplay
                label={outputLabel}
                value={outputValue}
                format={format}
                onFormatChange={setFormat}
              />
            )}
            {mode === 'file' && fileHash && (
              <OutputDisplay
                label={outputLabel}
                value={fileHash}
                format={format}
                onFormatChange={setFormat}
              />
            )}
          </>
        )}

        {(mode === 'hash' || mode === 'hmac') && (
          <CopyAsCode
            algorithm={effectiveAlgorithm}
            mode={mode}
            input={mode === 'hash' ? hashInput : hmacMessage}
            secretKey={mode === 'hmac' ? hmacSecret : undefined}
          />
        )}

        {mode === 'hash' && hashInput && (
          <MultiHashPreview input={hashInput} format={format} />
        )}

        <HashHistory
          entries={history}
          onClear={() => setHistory([])}
          onRestore={handleRestoreHistory}
        />

        <p className="text-text-muted text-xs text-center">
          Computed in-browser using the Web Crypto API — no data is sent to any server
        </p>
      </main>
    </div>
  )
}
