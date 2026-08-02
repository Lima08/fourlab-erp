import type { Evidence } from '@/shared/db/dexie'
import type { Tables } from '@/shared/db/database.types'
import { supabase } from '@/shared/db/supabase'
import { toLocalEvidence } from './mappers'

export function evidenceStoragePath(projectId: string, itemId: string, evidenceId: string): string {
  return `${projectId}/${itemId}/${evidenceId}`
}

export async function downloadEvidenceBlob(path: string): Promise<Blob> {
  const { data, error } = await supabase.storage.from('evidence').download(path)
  if (error || !data) {
    throw error ?? new Error('Download failed')
  }
  return data
}

export async function createEvidenceSignedUrl(
  path: string,
  expiresInSec = 3600
): Promise<string> {
  const { data, error } = await supabase.storage
    .from('evidence')
    .createSignedUrl(path, expiresInSec)
  if (error || !data?.signedUrl) {
    throw error ?? new Error('Signed URL failed')
  }
  return data.signedUrl
}

/** Map remote evidence metadata only (no Storage download). Preserves local blob if path matches. */
export function mapRemoteEvidenceMetadata(
  remote: Tables<'evidence'>,
  local?: Evidence
): Evidence {
  const mapped = toLocalEvidence(remote)
  if (local?.blob && local.storagePath === mapped.storagePath) {
    return { ...mapped, blob: local.blob }
  }
  if (local?.blob && local.syncedAt === null) {
    return local
  }
  return mapped
}

export async function hydrateRemoteEvidence(
  remote: Tables<'evidence'>,
  projectId: string
): Promise<Evidence> {
  void projectId
  const base = toLocalEvidence(remote)

  if (remote.type === 'comment' || !remote.blob_url) {
    return base
  }

  try {
    const blob = await downloadEvidenceBlob(remote.blob_url)
    return {
      ...base,
      blob,
      syncedAt: new Date(remote.updated_at),
    }
  } catch (error) {
    console.warn(`Falha ao baixar blob de evidência ${remote.id}:`, error)
    return base
  }
}

export async function hydrateRemoteEvidenceBatch(
  remotes: Tables<'evidence'>[],
  projectId: string
): Promise<Evidence[]> {
  return Promise.all(remotes.map((remote) => hydrateRemoteEvidence(remote, projectId)))
}
