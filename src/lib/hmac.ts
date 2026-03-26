import { md5 } from 'js-md5'
import { formatHash, type OutputFormat } from './format'
import { type HmacAlgorithm as Algorithm, type HmacAlgorithm } from './hash'

export type { HmacAlgorithm }
export type KeyFormat = 'utf8' | 'hex' | 'base64'

function parseKey(key: string, keyFormat: KeyFormat): Uint8Array<ArrayBuffer> {
  switch (keyFormat) {
    case 'utf8':
      return new TextEncoder().encode(key)
    case 'hex': {
      const clean = key.replace(/\s/g, '')
      if (clean.length % 2 !== 0) throw new Error('Hex key must have an even number of characters')
      const bytes = new Uint8Array(clean.length / 2)
      for (let i = 0; i < clean.length; i += 2) {
        const byte = parseInt(clean.slice(i, i + 2), 16)
        if (isNaN(byte)) throw new Error('Invalid hex key — non-hex characters found')
        bytes[i / 2] = byte
      }
      return bytes
    }
    case 'base64': {
      try {
        const binary = atob(key)
        return new Uint8Array(binary.split('').map(c => c.charCodeAt(0)))
      } catch {
        throw new Error('Invalid Base64 key')
      }
    }
  }
}

export async function computeHmac(
  algorithm: Algorithm,
  message: string,
  secretKey: string,
  keyFormat: KeyFormat,
  format: OutputFormat
): Promise<string> {
  const keyBytes = parseKey(secretKey, keyFormat)
  const msgBytes = new TextEncoder().encode(message)

  if (algorithm === 'MD5') {
    const raw = md5.hmac.arrayBuffer(keyBytes, msgBytes)
    return formatHash(raw, format)
  }

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: algorithm },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgBytes)
  return formatHash(sig, format)
}
