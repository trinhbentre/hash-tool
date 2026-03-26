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

  const btnClass = (alg: Algorithm) =>
    `px-3 py-1.5 rounded-md text-sm font-mono transition-colors duration-150 cursor-pointer ${
      activeAlg === alg
        ? 'bg-accent text-surface-900 font-semibold'
        : 'bg-surface-700 text-text-secondary border border-surface-600 hover:bg-surface-600'
    }`

  const groups = hmacOnly
    ? [{ algos: SHA_ALGOS }, { algos: OTHER_ALGOS.filter(a => HMAC_ALGOS.includes(a as HmacAlgorithm)) }]
    : [{ algos: SHA_ALGOS }, { algos: SHA3_ALGOS }, { algos: OTHER_ALGOS }]

  return (
    <div className="flex gap-2 flex-wrap items-center">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-1.5 flex-wrap">
          {gi > 0 && <span className="text-surface-600">|</span>}
          {group.algos.map(alg => (
            <button
              key={alg}
              onClick={() => onAlgorithmChange(alg)}
              className={btnClass(alg)}
            >
              {alg}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

