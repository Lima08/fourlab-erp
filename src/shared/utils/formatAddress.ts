import type { Project } from '../db/dexie'

export function formatAddress(project: Project) {
  return [
    project.street,
    project.number && `nº ${project.number}`,
    project.complement,
    project.postalCode && `CEP ${project.postalCode}`,
    project.city && project.state
      ? `${project.city}/${project.state}`
      : project.city || project.state,
  ]
    .filter(Boolean)
    .join(', ')
}
