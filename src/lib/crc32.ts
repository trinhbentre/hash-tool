import { type OutputFormat } from './format'

// CRC32 lookup table
const TABLE: Uint32Array = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[i] = c
  }
  return t
})()

export function crc32(input: string | ArrayBuffer): number {
  const bytes =
    typeof input === 'string'
      ? new TextEncoder().encode(input)
      : new Uint8Array(input)
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc = TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

export function crc32Formatted(input: string | ArrayBuffer, fmt: OutputFormat): string {
  const val = crc32(input)
  if (fmt === 'base64') {
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
  return fmt === 'HEX' ? hex.toUpperCase() : hex
}
