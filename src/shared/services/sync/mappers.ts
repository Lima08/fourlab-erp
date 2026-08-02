import type {
  DownloadState,
  Evidence,
  Item,
  ItemCategory,
  ItemStatus,
  LocalClient,
  Location,
  Project,
  ProjectDocumentType,
  UpdateState,
} from '@/shared/db/dexie'
import type { Tables, TablesInsert } from '@/shared/db/database.types'

type RemoteProjectRow = Tables<'projects'> & {
  responsible_profile_id?: string
  total_area?: number | null
  document_type?: string
  document_storage_path?: string | null
}

export function toLocalClient(r: Tables<'clients'>): LocalClient {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
  }
}

export function toLocalEvidence(r: Tables<'evidence'>): Evidence {
  return {
    id: r.id,
    itemId: r.item_id,
    type: r.type as Evidence['type'],
    blob: null,
    storagePath: r.blob_url,
    comment: r.comment,
    createdAt: new Date(r.created_at),
    technicianId: r.technician_id,
    // Metadata from remote is synced; blob may be hydrated later via downloadProjectMedia
    syncedAt: new Date(r.updated_at),
  }
}

export function toLocalProject(r: RemoteProjectRow): Project {
  return {
    id: r.id,
    clientId: r.client_id,
    responsibleProfileId: r.responsible_profile_id ?? '',
    totalArea: r.total_area != null ? Number(r.total_area) : null,
    documentType: (r.document_type ?? 'PT_APPROVED') as ProjectDocumentType,
    documentStoragePath: r.document_storage_path ?? null,
    name: r.name,
    description: r.description,
    street: r.street,
    number: r.number,
    complement: r.complement,
    neighborhood: r.neighborhood,
    city: r.city,
    state: r.state,
    postalCode: r.postal_code,
    status: r.status as Project['status'],
    downloadState: 'cloud' as DownloadState,
    updateState: 'updated' as UpdateState,
    completedItems: 0,
    totalItems: 0,
    createdAt: new Date(r.created_at),
    downloadedAt: new Date(0),
    syncedAt: null,
    serverUpdatedAt: null,
  }
}

export function toLocalLocation(r: Tables<'locations'>): Location {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    type: r.type as Location['type'],
    deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
    updatedAt: new Date(r.updated_at),
  }
}

export function toLocalItem(r: Tables<'items'>): Item {
  return {
    id: r.id,
    projectId: r.project_id,
    locationId: r.location_id,
    description: r.description,
    category: r.category as ItemCategory,
    status: r.status as ItemStatus,
    deletedAt: r.deleted_at ? new Date(r.deleted_at) : null,
    deletedById: r.deleted_by_id,
    updatedAt: new Date(r.updated_at),
    technicianId: r.technician_id,
    syncedAt: new Date(r.updated_at),
    conflictStatus: false,
    conflictRemoteStatus: null,
  }
}

export function toRemoteLocation(location: Location): TablesInsert<'locations'> {
  return {
    id: location.id,
    project_id: location.projectId,
    name: location.name,
    type: location.type,
  }
}

export function toRemoteItem(item: Item, userId: string): TablesInsert<'items'> {
  return {
    id: item.id,
    project_id: item.projectId,
    location_id: item.locationId,
    description: item.description,
    category: item.category,
    status: item.status,
    deleted_at: item.deletedAt ? new Date(item.deletedAt).toISOString() : null,
    deleted_by_id: item.deletedById,
    updated_at: new Date(item.updatedAt).toISOString(),
    technician_id: userId,
  }
}

export function toRemoteEvidence(
  ev: Evidence,
  blobUrl: string | null,
  userId: string
): TablesInsert<'evidence'> {
  return {
    id: ev.id,
    item_id: ev.itemId,
    type: ev.type,
    blob_url: blobUrl,
    comment: ev.comment,
    created_at: new Date(ev.createdAt).toISOString(),
    technician_id: userId,
  }
}
