import { useState } from 'react'
import { type Algorithm } from '../lib/hash'

interface CopyAsCodeProps {
  algorithm: Algorithm
  mode: 'hash' | 'hmac'
  input?: string
  secretKey?: string
}

type Lang = 'python' | 'node' | 'openssl' | 'shell'

const LANG_LABELS: Record<Lang, string> = {
  python: 'Python',
  node: 'Node.js',
  openssl: 'openssl',
  shell: 'shasum / md5',
}

function getHashName(algorithm: Algorithm): { py: string; node: string; openssl: string; shasum: string | null } {
  switch (algorithm) {
    case 'MD5':      return { py: 'md5',      node: 'md5',       openssl: 'md5',       shasum: 'md5' }
    case 'SHA-1':    return { py: 'sha1',     node: 'sha1',      openssl: 'sha1',      shasum: '1' }
    case 'SHA-256':  return { py: 'sha256',   node: 'sha256',    openssl: 'sha256',    shasum: '256' }
    case 'SHA-384':  return { py: 'sha384',   node: 'sha384',    openssl: 'sha384',    shasum: '384' }
    case 'SHA-512':  return { py: 'sha512',   node: 'sha512',    openssl: 'sha512',    shasum: '512' }
    case 'SHA3-256': return { py: 'sha3_256', node: 'sha3-256',  openssl: 'sha3-256',  shasum: null }
    case 'SHA3-512': return { py: 'sha3_512', node: 'sha3-512',  openssl: 'sha3-512',  shasum: null }
    case 'CRC32':    return { py: 'crc32',    node: 'crc32',     openssl: '',          shasum: null }
  }
}

function escape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

function buildSnippets(props: CopyAsCodeProps): Record<Lang, string> {
  const { algorithm, mode, input = '', secretKey = '' } = props
  const names = getHashName(algorithm)
  const msg = escape(input) || 'your message here'
  const key = escape(secretKey) || 'your secret key'

  if (mode === 'hash') {
    if (algorithm === 'CRC32') {
      return {
        python: `import zlib\nprint(hex(zlib.crc32(b"${msg}") & 0xffffffff))`,
        node: `const crc32 = require('crc-32');\nconsole.log((crc32.str("${msg}") >>> 0).toString(16));`,
        openssl: `# CRC32 is not supported by openssl`,
        shell: `# CRC32 is not supported by shasum`,
      }
    }
    const shaPython = `import hashlib\nprint(hashlib.${names.py}(b"${msg}").hexdigest())`
    const shaNode = `const crypto = require('crypto');\nconsole.log(crypto.createHash('${names.node}').update("${msg}").digest('hex'));`
    const shaOpenssl = `echo -n "${msg}" | openssl dgst -${names.openssl}${algorithm === 'MD5' ? '' : ''}`
    const shaShell = names.shasum
      ? algorithm === 'MD5'
        ? `echo -n "${msg}" | md5sum\n# macOS:\necho -n "${msg}" | md5`
        : `echo -n "${msg}" | shasum -a ${names.shasum}`
      : `# ${algorithm} is not supported by shasum`
    return { python: shaPython, node: shaNode, openssl: shaOpenssl, shell: shaShell }
  }

  // HMAC mode
  const hmacPython = `import hmac, hashlib\nresult = hmac.new(b"${key}", b"${msg}", hashlib.${names.py}).hexdigest()\nprint(result)`
  const hmacNode = `const crypto = require('crypto');\nconsole.log(crypto.createHmac('${names.node}', "${key}").update("${msg}").digest('hex'));`
  const hmacOpenssl = `echo -n "${msg}" | openssl dgst -${names.openssl} -hmac "${key}"`
  return { python: hmacPython, node: hmacNode, openssl: hmacOpenssl, shell: `# HMAC not supported by shasum` }
}

export function CopyAsCode({ algorithm, mode, input, secretKey }: CopyAsCodeProps) {
  const [open, setOpen] = useState(false)
  const [lang, setLang] = useState<Lang>('python')
  const [copied, setCopied] = useState(false)

  const snippets = buildSnippets({ algorithm, mode, input, secretKey })
  const current = snippets[lang]

  const handleCopy = () => {
    navigator.clipboard.writeText(current).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="border border-surface-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-surface-800 hover:bg-surface-700 transition-colors cursor-pointer"
        aria-expanded={open}
      >
        <span className="text-text-secondary text-sm">Copy as code snippet</span>
        <span className="text-text-muted text-xs">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-0 bg-surface-900">
          {/* Language tabs */}
          <div className="flex border-b border-surface-700">
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-2 text-xs transition-colors cursor-pointer ${
                  lang === l
                    ? 'text-accent border-b-2 border-accent -mb-px'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {LANG_LABELS[l]}
              </button>
            ))}
            <div className="flex-1" />
            <button
              onClick={handleCopy}
              className="text-xs px-3 text-text-secondary hover:text-accent transition-colors cursor-pointer"
              aria-label="Copy snippet to clipboard"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>

          <pre className="px-4 py-3 text-xs text-text-primary font-mono whitespace-pre-wrap overflow-x-auto leading-relaxed">
            {current}
          </pre>
        </div>
      )}
    </div>
  )
}
