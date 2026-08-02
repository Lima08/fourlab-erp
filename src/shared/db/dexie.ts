import Dexie, { type EntityTable } from 'dexie'

export type DownloadState = 'device' | 'cloud'
export type UpdateState = 'updated' | 'update_available'
export type ProjectDocumentType = 'PT_APPROVED' | 'IPTU'

export interface LocalClient {
  id: string
  name: string
  phone: string | null
}

export interface Project {
  id: string
  name: string
  street: string
  number: string
  complement: string | null
  neighborhood: string
  city: string
  state: string
  postalCode: string
  description: string
  clientId: string
  responsibleProfileId: string
  totalArea: number | null
  documentType: ProjectDocumentType
  documentStoragePath: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'canceled'
  downloadState: DownloadState
  updateState: UpdateState
  completedItems: number
  totalItems: number
  createdAt?: Date
  downloadedAt: Date
  syncedAt: Date | null
  serverUpdatedAt: Date | null
}

export interface CountByStatus {
  all: number
  pending: number
  in_progress: number
  completed: number
  canceled: number
  device: number
  cloud: number
}

export interface Location {
  id: string
  projectId: string
  name: string
  type: 'room' | 'floor' | 'building' | 'outdoor' | 'other'
  deletedAt: Date | null
  updatedAt: Date
}

export interface Item {
  id: string
  projectId: string
  locationId: string | null
  description: string
  category: ItemCategory
  status: ItemStatus
  deletedAt: Date | null
  deletedById: string | null
  updatedAt: Date
  technicianId: string
  syncedAt: Date | null
  conflictStatus: boolean
  conflictRemoteStatus: ItemStatus | null
}

export type ItemStatus = 'pending' | 'regular' | 'irregular' | 'absent'
export type ItemCategory =
  | 'extinguisher'
  | 'emergency_exit'
  | 'lighting'
  | 'sprinkler'
  | 'alarm'
  | 'other'

export interface Evidence {
  id: string
  itemId: string
  type: 'photo' | 'video' | 'comment'
  blob: Blob | null
  /** Storage object path (`projectId/itemId/evidenceId`); null for unsynced local media / comments. */
  storagePath: string | null
  comment: string | null
  createdAt: Date
  technicianId: string
  syncedAt: Date | null
}

export interface SyncQueueEntry {
  id?: number
  type:
    | 'item_update'
    | 'evidence_add'
    | 'evidence_delete'
    | 'item_add'
    | 'item_delete'
    | 'location_add'
    | 'location_update'
    | 'location_delete'
    | 'project_update'
  payload: string
  attempts: number
  createdAt: Date
}

export interface DeadLetterEntry {
  id?: number
  type: SyncQueueEntry['type']
  payload: string
  failureReason: string
  originalEntryId: number
  createdAt: Date
}

class VistoriaDB extends Dexie {
  clients!: EntityTable<LocalClient, 'id'>
  projects!: EntityTable<Project, 'id'>
  locations!: EntityTable<Location, 'id'>
  items!: EntityTable<Item, 'id'>
  evidence!: EntityTable<Evidence, 'id'>
  syncQueue!: EntityTable<SyncQueueEntry, 'id'>
  deadLetterQueue!: EntityTable<DeadLetterEntry, 'id'>

  constructor() {
    super('VistoriaDB')
    this.version(1).stores({
      clients: 'id',
      projects: 'id, status, downloadState, downloadedAt, clientId',
      locations: 'id, projectId, type',
      items: 'id, projectId, locationId, status, deletedAt',
      evidence: 'id, itemId, type, createdAt',
      syncQueue: '++id, type, attempts, createdAt',
    })
    this.version(2).stores({
      clients: 'id',
      projects: 'id, status, downloadState, downloadedAt, clientId',
      locations: 'id, projectId, type',
      items: 'id, projectId, locationId, status, deletedAt, syncedAt',
      evidence: 'id, itemId, type, createdAt, syncedAt',
      syncQueue: '++id, type, attempts, createdAt',
      deadLetterQueue: '++id, type, createdAt',
    })
    this.version(3)
      .stores({
        clients: 'id',
        projects: 'id, status, downloadState, downloadedAt, clientId',
        locations: 'id, projectId, type',
        items: 'id, projectId, locationId, status, deletedAt, syncedAt',
        evidence: 'id, itemId, type, createdAt, syncedAt',
        syncQueue: '++id, type, attempts, createdAt',
        deadLetterQueue: '++id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('items')
          .toCollection()
          .modify((item) => {
            item.conflictStatus ??= false
            item.conflictRemoteStatus ??= null
          })
      })
    this.version(4)
      .stores({
        clients: 'id',
        projects: 'id, status, downloadState, downloadedAt, clientId',
        locations: 'id, projectId, type, deletedAt',
        items: 'id, projectId, locationId, status, deletedAt, syncedAt',
        evidence: 'id, itemId, type, createdAt, syncedAt',
        syncQueue: '++id, type, attempts, createdAt',
        deadLetterQueue: '++id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('locations')
          .toCollection()
          .modify((loc) => {
            loc.deletedAt ??= null
            loc.updatedAt ??= new Date()
          })
      })
    this.version(5)
      .stores({
        profiles: 'id',
        projects: 'id, status, downloadState, downloadedAt, clientProfileId',
        locations: 'id, projectId, type, deletedAt',
        items: 'id, projectId, locationId, status, deletedAt, syncedAt',
        evidence: 'id, itemId, type, createdAt, syncedAt',
        syncQueue: '++id, type, attempts, createdAt',
        deadLetterQueue: '++id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('projects')
          .toCollection()
          .modify((p) => {
            if (p.clientId != null) {
              p.clientProfileId = p.clientId
              delete p.clientId
            }
          })
        await tx.table('clients').clear()
      })
    this.version(6)
      .stores({
        clients: 'id',
        projects: 'id, status, downloadState, downloadedAt, clientId',
        locations: 'id, projectId, type, deletedAt',
        items: 'id, projectId, locationId, status, deletedAt, syncedAt',
        evidence: 'id, itemId, type, createdAt, syncedAt',
        syncQueue: '++id, type, attempts, createdAt',
        deadLetterQueue: '++id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx.table('profiles').clear()
        await tx
          .table('projects')
          .toCollection()
          .modify((p) => {
            if (p.clientProfileId != null) {
              p.clientId = p.clientProfileId
              delete p.clientProfileId
            }
          })
      })
    this.version(7)
      .stores({
        clients: 'id',
        projects: 'id, status, downloadState, downloadedAt, clientId',
        locations: 'id, projectId, type, deletedAt',
        items: 'id, projectId, locationId, status, deletedAt, syncedAt',
        evidence: 'id, itemId, type, createdAt, syncedAt',
        syncQueue: '++id, type, attempts, createdAt',
        deadLetterQueue: '++id, type, createdAt',
      })
      .upgrade(async (tx) => {
        await tx
          .table('evidence')
          .toCollection()
          .modify((ev) => {
            ev.storagePath ??= null
          })
      })
  }
}

export const db = new VistoriaDB()
