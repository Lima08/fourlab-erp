import { supabase } from '@/shared/db/supabase'

export interface Client {
  id: string
  name: string
}

export interface CreateClientInput {
  name: string
  phone: string
}

export async function fetchClients(): Promise<Client[]> {
  const { data, error } = await supabase.from('clients').select('id, name').order('name')

  if (error) throw error

  return data ?? []
}

export async function createClient(values: CreateClientInput): Promise<Client> {
  const { data, error } = await supabase.from('clients').insert(values).select('id, name').single()

  if (error) throw error

  return data
}
