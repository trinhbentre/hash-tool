import { md5 } from 'js-md5'
import { formatHash, type OutputFormat } from './format'
import { computeSha3, type Sha3Algorithm } from './sha3'
import { crc32Formatted } from './crc32'

export type ShaAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'
export type HmacAlgorithm = ShaAlgorithm | 'MD5'
export type Algorithm = HmacAlgorithm | Sha3Algorithm | 'CRC32'

export async function computeHash(
  algorithm: Algorithm,
  input: string | ArrayBuffer,
  format: OutputFormat
): Promise<string> {
  if (algorithm === 'MD5') {
    const raw = md5.arrayBuffer(input)
    return formatHash(raw, format)
  }
  if (algorithm === 'SHA3-256' || algorithm === 'SHA3-512') {
    return computeSha3(algorithm, input, format)
  }
  if (algorithm === 'CRC32') {
    return crc32Formatted(input, format)
  }
  const buf = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input
  const hashBuffer = await crypto.subtle.digest(algorithm, buf)
  return formatHash(hashBuffer, format)
}
