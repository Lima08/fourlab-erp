import { useEffect, useState } from 'react'

interface StorageStatus {
  isPersisted: boolean
  usageBytes: number
  quotaBytes: number
  usagePercent: number
  isAlmostFull: boolean
}

const DEFAULT: StorageStatus = {
  isPersisted: false,
  usageBytes: 0,
  quotaBytes: 0,
  usagePercent: 0,
  isAlmostFull: false,
}

export function useStorageMonitor(): StorageStatus {
  const [status, setStatus] = useState<StorageStatus>(DEFAULT)

  useEffect(() => {
    if (!navigator.storage) return

    async function init() {
      const isPersisted = await navigator.storage.persist()
      await refresh(isPersisted)
    }

    async function refresh(isPersisted?: boolean) {
      const estimate = await navigator.storage.estimate()
      const usageBytes = estimate.usage ?? 0
      const quotaBytes = estimate.quota ?? 0
      const usagePercent = quotaBytes > 0 ? (usageBytes / quotaBytes) * 100 : 0

      setStatus({
        isPersisted: isPersisted ?? (await navigator.storage.persisted()),
        usageBytes,
        quotaBytes,
        usagePercent,
        isAlmostFull: usagePercent > 80,
      })
    }

    init()
  }, [])

  return status
}
