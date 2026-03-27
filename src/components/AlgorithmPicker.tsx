import { Button } from '@web-tools/ui'
import { type Algorithm, type HmacAlgorithm } from '../lib/hash'

interface AlgorithmPickerProps {
  algorithm: Algorithm
  onAlgorithmChange: (alg: Algorithm) => void
  /** If true, only show algorithms supported by HMAC (SHA family + MD5) */
  hmacOnly?: boolean
}

const SHA_ALGOS: Algorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512']
const SHA3_ALGOS: Algorithm[] = ['SHA3-256', 'SHA3-512']
const OTHER_ALGOS: Algorithm[] = ['MD5', 'CRC32']
const HMAC_ALGOS: HmacAlgorithm[] = ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512', 'MD5']

export function AlgorithmPicker({ algorithm, onAlgorithmChange, hmacOnly = false }: AlgorithmPickerProps) {
  const activeAlg = hmacOnly && !HMAC_ALGOS.includes(algorithm as HmacAlgorithm)
    ? 'SHA-256'
    : algorithm

  const groups = hmacOnly
    ? [{ algos: SHA_ALGOS }, { algos: OTHER_ALGOS.filter(a => HMAC_ALGOS.includes(a as HmacAlgorithm)) }]
    : [{ algos: SHA_ALGOS }, { algos: SHA3_ALGOS }, { algos: OTHER_ALGOS }]

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1.5 flex-wrap">
          {gi > 0 && <span className="text-surface-600">|</span>}
          {group.algos.map(alg => (
            <Button
              key={alg}
              size="md"
              variant={activeAlg === alg ? 'primary' : 'secondary'}
              onClick={() => onAlgorithmChange(alg)}
              className="font-mono"
            >
              {alg}
            </Button>
          ))}
        </div>
      ))}
    </div>
  )
}

