export interface Profile {
  id: string
  fullName: string
  email: string
  phone: string | null
  isActive: boolean
  /** Null until the invite activation flow succeeds; kept after admin deactivation. */
  activatedAt: string | null
  createdAt: string
  updatedAt: string
}
