import { supabase } from '@/shared/db/supabase'

export interface ClientSummary {
  id: string
  name: string
}

interface ClientRow {
  id: string
  name: string
}

function toClientSummary(row: ClientRow): ClientSummary {
  return {
    id: row.id,
    name: row.name,
  }
}

export async function fetchClientsList(): Promise<ClientSummary[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('id, name')
    .order('name', { ascending: true })

  if (error) throw error

  return (data ?? []).map(toClientSummary)
}
