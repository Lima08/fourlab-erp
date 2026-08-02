import { supabase } from '@/shared/db/supabase'
import { stripDigits } from '@/shared/utils/brazilianDocuments'
import type { Database } from '@/shared/db/database.types'

export type CustomerType = 'pf' | 'pj'
export type CustomerStatusFilter = 'active' | 'inactive' | 'all'

export interface Customer {
  id: string
  customerType: CustomerType
  document: string | null
  fullName: string
  tradeName: string | null
  email: string | null
  phone: string | null
  zipCode: string | null
  street: string | null
  number: string | null
  complement: string | null
  neighborhood: string | null
  city: string | null
  state: string | null
  instagram: string | null
  facebook: string | null
  linkedin: string | null
  website: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerWriteInput {
  customerType: CustomerType
  fullName: string
  tradeName?: string | null
  document?: string | null
  email?: string | null
  phone?: string | null
  zipCode?: string | null
  street?: string | null
  number?: string | null
  complement?: string | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  instagram?: string | null
  facebook?: string | null
  linkedin?: string | null
  website?: string | null
  notes?: string | null
}

export interface CustomerOrderSummary {
  id: string
  status: Database['public']['Enums']['order_status']
  totalAmount: number
  issueDate: string
}

export interface ListCustomersParams {
  page: number
  pageSize?: number
  status: CustomerStatusFilter
  search: string
}

export interface ListCustomersResult {
  rows: Customer[]
  total: number
}

export type CustomerErrorCode = 'DOCUMENT_CONFLICT'

export class CustomerError extends Error {
  code: CustomerErrorCode

  constructor(code: CustomerErrorCode, message: string) {
    super(message)
    this.name = 'CustomerError'
    this.code = code
  }
}

type CustomerRow = Database['public']['Tables']['customers']['Row']
type CustomerInsert = Database['public']['Tables']['customers']['Insert']
type OrderRow = Database['public']['Tables']['orders']['Row']

const DEFAULT_PAGE_SIZE = 20

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&')
}

function normalizeDocument(document?: string | null): string | null {
  if (!document) return null
  const digits = stripDigits(document)
  return digits.length > 0 ? digits : null
}

function toCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    customerType: row.customer_type,
    document: row.document,
    fullName: row.full_name,
    tradeName: row.trade_name,
    email: row.email,
    phone: row.phone,
    zipCode: row.zip_code,
    street: row.street,
    number: row.number,
    complement: row.complement,
    neighborhood: row.neighborhood,
    city: row.city,
    state: row.state,
    instagram: row.instagram,
    facebook: row.facebook,
    linkedin: row.linkedin,
    website: row.website,
    notes: row.notes,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function toCustomerInsert(input: CustomerWriteInput): CustomerInsert {
  return {
    customer_type: input.customerType,
    full_name: input.fullName.trim(),
    trade_name: input.customerType === 'pj' ? (input.tradeName?.trim() ?? null) : null,
    document: normalizeDocument(input.document),
    email: input.email?.trim() ?? null,
    phone: input.phone ? stripDigits(input.phone) : null,
    zip_code: input.zipCode ? stripDigits(input.zipCode) : null,
    street: input.street?.trim() ?? null,
    number: input.number?.trim() ?? null,
    complement: input.complement?.trim() ?? null,
    neighborhood: input.neighborhood?.trim() ?? null,
    city: input.city?.trim() ?? null,
    state: input.state?.trim().toUpperCase() ?? null,
    instagram: input.instagram?.trim() ?? null,
    facebook: input.facebook?.trim() ?? null,
    linkedin: input.linkedin?.trim() ?? null,
    website: input.website?.trim() ?? null,
    notes: input.notes?.trim() ?? null,
  }
}

function mapPostgresError(error: { code?: string; message: string }): never {
  if (error.code === '23505') {
    throw new CustomerError('DOCUMENT_CONFLICT', 'Já existe cliente com este documento')
  }
  throw error
}

function toOrderSummary(row: OrderRow): CustomerOrderSummary {
  return {
    id: row.id,
    status: row.status,
    totalAmount: row.total_amount,
    issueDate: row.issue_date,
  }
}

export async function listCustomers(params: ListCustomersParams): Promise<ListCustomersResult> {
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE
  const from = (params.page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('customers').select('*', { count: 'exact' })

  if (params.status === 'active') {
    query = query.eq('is_active', true)
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const trimmedSearch = params.search.trim()
  if (trimmedSearch) {
    const escaped = escapeIlikePattern(trimmedSearch)
    const pattern = `%${escaped}%`
    query = query.or(
      `full_name.ilike.${pattern},trade_name.ilike.${pattern},document.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`
    )
  }

  const { data, error, count } = await query
    .order('full_name', { ascending: true })
    .range(from, to)

  if (error) throw error

  return {
    rows: (data ?? []).map((row) => toCustomer(row as CustomerRow)),
    total: count ?? 0,
  }
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle()

  if (error) throw error
  if (!data) return null

  return toCustomer(data as CustomerRow)
}

export async function createCustomer(input: CustomerWriteInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .insert(toCustomerInsert(input))
    .select('*')
    .single()

  if (error) mapPostgresError(error)

  return toCustomer(data as CustomerRow)
}

export async function updateCustomer(id: string, input: CustomerWriteInput): Promise<Customer> {
  const { data, error } = await supabase
    .from('customers')
    .update({
      ...toCustomerInsert(input),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) mapPostgresError(error)

  return toCustomer(data as CustomerRow)
}

export async function setCustomerActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase
    .from('customers')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function listCustomerOrders(customerId: string): Promise<CustomerOrderSummary[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, issue_date')
    .eq('customer_id', customerId)
    .order('issue_date', { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => toOrderSummary(row as OrderRow))
}
