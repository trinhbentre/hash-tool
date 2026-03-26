import { sha3_256, sha3_512 } from 'js-sha3'
import { formatHash, type OutputFormat } from './format'

export type Sha3Algorithm = 'SHA3-256' | 'SHA3-512'

export function computeSha3(
  algorithm: Sha3Algorithm,
  input: string | ArrayBuffer,
  format: OutputFormat
): string {
  const fn = algorithm === 'SHA3-256' ? sha3_256 : sha3_512
  const raw = fn.arrayBuffer(input instanceof ArrayBuffer ? input : new TextEncoder().encode(input))
  return formatHash(raw, format)
}
