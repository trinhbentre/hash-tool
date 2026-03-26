export type OutputFormat = 'hex' | 'HEX' | 'base64'

export function formatHash(buf: ArrayBuffer, fmt: OutputFormat): string {
  const bytes = new Uint8Array(buf)
  if (fmt === 'base64') {
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary)
  }
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return fmt === 'HEX' ? hex.toUpperCase() : hex
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength
}
