import { md5 } from 'js-md5'
import { sha256 } from 'js-sha256'
import { sha512, sha384 } from 'js-sha512'
import { sha1 } from 'js-sha1'
import { sha3_256, sha3_512 } from 'js-sha3'
import { formatHash, type OutputFormat } from '../lib/format'
import { crc32Formatted } from '../lib/crc32'

/** 64 MB chunks — keeps per-chunk allocation low even for huge files */
const CHUNK = 64 * 1024 * 1024

type WorkerInput = File | ArrayBuffer

interface WorkerRequest {
  id: number
  algorithm: string
  input: WorkerInput
  format: OutputFormat
}

interface StreamableHasher {
  update(data: ArrayBuffer): void
  hex(): string
  arrayBuffer(): ArrayBuffer
}

function createHasher(algorithm: string): StreamableHasher | null {
  switch (algorithm) {
    case 'SHA-1':    return sha1.create() as unknown as StreamableHasher
    case 'SHA-256':  return sha256.create() as unknown as StreamableHasher
    case 'SHA-384':  return sha384.create() as unknown as StreamableHasher
    case 'SHA-512':  return sha512.create() as unknown as StreamableHasher
    case 'SHA3-256': return sha3_256.create() as unknown as StreamableHasher
    case 'SHA3-512': return sha3_512.create() as unknown as StreamableHasher
    case 'MD5':      return md5.create() as unknown as StreamableHasher
    default:         return null
  }
}

async function hashStreaming(
  id: number,
  algorithm: string,
  file: File,
  format: OutputFormat
): Promise<string> {
  if (algorithm === 'CRC32') {
    // CRC32 lookup-table approach — still needs all bytes, but we process in-worker
    // For truly huge files this will use memory but keeps main thread free
    const hasher = { crc: 0xffffffff, update(buf: ArrayBuffer) {
      const bytes = new Uint8Array(buf)
      for (const b of bytes) {
        this.crc = (this.crc >>> 8) ^ TABLE[(this.crc ^ b) & 0xff]
      }
    }}
    let processed = 0
    let offset = 0
    while (offset < file.size) {
      const chunk = await file.slice(offset, Math.min(offset + CHUNK, file.size)).arrayBuffer()
      hasher.update(chunk)
      processed += chunk.byteLength
      offset += CHUNK
      self.postMessage({ id, type: 'progress', progress: processed / file.size })
    }
    const val = (hasher.crc ^ 0xffffffff) >>> 0
    if (format === 'base64') {
      const bytes = new Uint8Array(4)
      bytes[0] = (val >>> 24) & 0xff
      bytes[1] = (val >>> 16) & 0xff
      bytes[2] = (val >>> 8) & 0xff
      bytes[3] = val & 0xff
      let binary = ''
      bytes.forEach(b => { binary += String.fromCharCode(b) })
      return btoa(binary)
    }
    const hex = val.toString(16).padStart(8, '0')
    return format === 'HEX' ? hex.toUpperCase() : hex
  }

  const hasher = createHasher(algorithm)
  if (!hasher) throw new Error(`Unsupported algorithm: ${algorithm}`)

  let processed = 0
  let offset = 0
  while (offset < file.size) {
    const chunk = await file.slice(offset, Math.min(offset + CHUNK, file.size)).arrayBuffer()
    hasher.update(chunk)
    processed += chunk.byteLength
    offset += CHUNK
    self.postMessage({ id, type: 'progress', progress: processed / file.size })
  }

  return formatHashFromHex(hasher.hex(), format)
}

function formatHashFromHex(hex: string, format: OutputFormat): string {
  if (format === 'hex') return hex
  if (format === 'HEX') return hex.toUpperCase()
  // base64 — convert hex string to bytes then btoa
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  let binary = ''
  bytes.forEach(b => { binary += String.fromCharCode(b) })
  return btoa(binary)
}

// CRC32 lookup table (duplicated here for worker isolation)
const TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[i] = c
  }
  return t
})()

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, algorithm, input, format } = e.data
  try {
    let hash: string

    if (input instanceof File) {
      // Streaming path — no large ArrayBuffer allocated in main thread
      hash = await hashStreaming(id, algorithm, input, format)
    } else {
      // Pre-loaded ArrayBuffer path (kept for small inputs passed as buffers)
      if (algorithm === 'CRC32') {
        hash = crc32Formatted(input, format)
      } else if (algorithm === 'SHA3-256') {
        hash = formatHashFromHex(sha3_256.hex(input), format)
      } else if (algorithm === 'SHA3-512') {
        hash = formatHashFromHex(sha3_512.hex(input), format)
      } else if (algorithm === 'MD5') {
        hash = formatHash(md5.arrayBuffer(input), format)
      } else {
        const hashBuffer = await crypto.subtle.digest(algorithm as AlgorithmIdentifier, input)
        hash = formatHash(hashBuffer, format)
      }
    }

    self.postMessage({ id, type: 'result', hash })
  } catch (err) {
    self.postMessage({ id, type: 'error', message: err instanceof Error ? err.message : 'Unknown error' })
  }
}
