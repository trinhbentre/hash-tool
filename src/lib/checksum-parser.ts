export interface ChecksumEntry {
  hash: string
  filename: string
}

/**
 * Parses standard checksum file formats:
 *   "<hash>  <filename>"  (2 spaces — binary mode, shasum default)
 *   "<hash> *<filename>"  (space + asterisk — openssl style)
 *   "<hash> <filename>"   (1 space — text mode)
 */
export function parseChecksumFile(content: string): ChecksumEntry[] {
  return content
    .split('\n')
    .map(l => l.trim())
    .filter(l => l !== '' && !l.startsWith('#'))
    .flatMap(line => {
      // 2-space binary: "abc123  file.txt"
      const m2 = line.match(/^([0-9a-fA-F]+)\s{2}(.+)$/)
      if (m2) return [{ hash: m2[1].toLowerCase(), filename: m2[2] }]
      // asterisk: "abc123 *file.txt"
      const mAst = line.match(/^([0-9a-fA-F]+) \*(.+)$/)
      if (mAst) return [{ hash: mAst[1].toLowerCase(), filename: mAst[2] }]
      // 1-space: "abc123 file.txt"
      const m1 = line.match(/^([0-9a-fA-F]+) (.+)$/)
      if (m1) return [{ hash: m1[1].toLowerCase(), filename: m1[2] }]
      return []
    })
}

const ALGO_MAP: Record<number, string> = {
  8: 'CRC32',
  32: 'MD5',
  40: 'SHA-1',
  64: 'SHA-256',
  96: 'SHA-384',
  128: 'SHA-512',
}

export function detectAlgorithmFromHashLength(hash: string): string | null {
  return ALGO_MAP[hash.trim().length] ?? null
}
