import { useRef, useCallback, useEffect } from 'react'
import { type Algorithm } from '../lib/hash'
import { type OutputFormat } from '../lib/format'

type Pending = { resolve: (hash: string) => void; reject: (err: string) => void }

export function useHashWorker() {
  const workerRef = useRef<Worker | null>(null)
  const pendingRef = useRef<Map<number, Pending>>(new Map())
  const progressRef = useRef<Map<number, (p: number) => void>>(new Map())
  const idRef = useRef(0)

  useEffect(() => {
    return () => {
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  const getWorker = useCallback((): Worker => {
    if (!workerRef.current) {
      const w = new Worker(
        new URL('../workers/hash.worker.ts', import.meta.url),
        { type: 'module' }
      )
      w.onmessage = (e: MessageEvent<{ id: number; type: 'result' | 'error' | 'progress'; hash?: string; message?: string; progress?: number }>) => {
        const { id, type, hash, message, progress } = e.data
        if (type === 'progress') {
          progressRef.current.get(id)?.(progress ?? 0)
          return
        }
        const pending = pendingRef.current.get(id)
        if (!pending) return
        pendingRef.current.delete(id)
        progressRef.current.delete(id)
        if (type === 'result') pending.resolve(hash!)
        else pending.reject(message ?? 'Worker error')
      }
      w.onerror = () => {
        pendingRef.current.forEach(p => p.reject('Worker crashed'))
        pendingRef.current.clear()
        progressRef.current.clear()
        workerRef.current = null
      }
      workerRef.current = w
    }
    return workerRef.current
  }, [])

  const hashInWorker = useCallback((
    algorithm: Algorithm,
    /** Pass a File directly for large files — avoids loading into main-thread memory */
    input: File | ArrayBuffer,
    format: OutputFormat,
    onProgress?: (progress: number) => void
  ): Promise<string> => {
    const id = ++idRef.current
    return new Promise((resolve, reject) => {
      pendingRef.current.set(id, { resolve, reject })
      if (onProgress) progressRef.current.set(id, onProgress)

      if (input instanceof File) {
        // File is structured-cloneable — no transfer needed, no main-thread memory allocation
        getWorker().postMessage({ id, algorithm, input, format })
      } else {
        // Transfer the ArrayBuffer (zero-copy) — caller must not use it after this
        getWorker().postMessage({ id, algorithm, input, format }, [input])
      }
    })
  }, [getWorker])

  return { hashInWorker }
}
