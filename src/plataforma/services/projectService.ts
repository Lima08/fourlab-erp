import { supabase } from '@/shared/db/supabase'
import type { ProjectFormValues } from '@/plataforma/schemas/projectFormSchema'

export type ProjectDocumentType = 'PT_APPROVED' | 'IPTU'

export interface CreateProjectInput extends ProjectFormValues {
  documentType: ProjectDocumentType
  documentFile: File
  responsibleProfileId: string
}

function projectDocumentStoragePath(projectId: string, fileName: string): string {
  return `${projectId}/${fileName}`
}

export async function createProject(values: CreateProjectInput): Promise<string> {
  const id = crypto.randomUUID()
  const documentStoragePath = projectDocumentStoragePath(id, values.documentFile.name)

  const { error: uploadError } = await supabase.storage
    .from('project-documents')
    .upload(documentStoragePath, values.documentFile, {
      contentType: values.documentFile.type,
    })
  if (uploadError) throw uploadError

  const { error } = await supabase.from('projects').insert({
    id,
    name: values.name,
    description: values.description,
    postal_code: values.postal_code,
    street: values.street,
    number: values.number,
    complement: values.complement || null,
    neighborhood: values.neighborhood,
    city: values.city,
    state: values.state,
    client_id: values.responsible_client,
    total_area: values.total_area,
    document_type: values.documentType,
    document_storage_path: documentStoragePath,
    responsible_profile_id: values.responsibleProfileId,
  })

  if (error) throw error

  return id
}
