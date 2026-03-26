import { type Algorithm } from './hash'

const HEX_LENGTH_MAP: Partial<Record<number, Algorithm>> = {
  32: 'MD5',
  40: 'SHA-1',
  64: 'SHA-256',
  96: 'SHA-384',
  128: 'SHA-512',
}

export function detectAlgorithm(hash: string): Algorithm | null {
  const trimmed = hash.trim()
  if (!trimmed) return null
  if (!/^[0-9a-fA-F]+$/.test(trimmed)) return null
  return HEX_LENGTH_MAP[trimmed.length] ?? null
}
