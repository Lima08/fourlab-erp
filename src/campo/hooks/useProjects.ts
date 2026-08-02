import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/shared/db/dexie'
import type { DownloadState, Project } from '@/shared/db/dexie'
import { refreshRemoteProjectMetadata } from '@/shared/services/sync/syncService'
import { useConnectivity } from '@/shared/hooks/useConnectivity'
import { matchesSearchText } from '@/shared/utils/normalizeSearchText'

type ProjectStatus = Project['status']

export type StatusCounts = {
  all: number
  pending: number
  in_progress: number
  completed: number
  canceled: number
  device: number
  cloud: number
}

export function useProjects(
  search?: string,
  status?: ProjectStatus,
  downloadState?: DownloadState
) {
  const { isOnline } = useConnectivity()
  const rawProjects = useLiveQuery(() => db.projects.toArray(), [])
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOnline) return

    let cancelled = false

    void (async () => {
      setIsRefreshing(true)
      try {
        await refreshRemoteProjectMetadata()
      } catch (err) {
        console.error(err)
      } finally {
        if (!cancelled) setIsRefreshing(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isOnline])

  const counts = useMemo<StatusCounts>(() => {
    if (!rawProjects) {
      return {
        all: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        canceled: 0,
        device: 0,
        cloud: 0,
      }
    }
    return {
      all: rawProjects.length,
      pending: rawProjects.filter((p) => p.status === 'pending').length,
      in_progress: rawProjects.filter((p) => p.status === 'in_progress').length,
      completed: rawProjects.filter((p) => p.status === 'completed').length,
      canceled: rawProjects.filter((p) => p.status === 'canceled').length,
      device: rawProjects.filter((p) => p.downloadState === 'device').length,
      cloud: rawProjects.filter((p) => p.downloadState === 'cloud').length,
    }
  }, [rawProjects])

  const projects = useMemo(() => {
    if (!rawProjects) return undefined
    const query = search?.trim()
    return rawProjects.filter((p) => {
      if (query && !matchesSearchText(p.name, query)) return false
      if (status && p.status !== status) return false
      if (downloadState && p.downloadState !== downloadState) return false
      return true
    })
  }, [rawProjects, search, status, downloadState])

  return { projects, counts, isRefreshing }
}
