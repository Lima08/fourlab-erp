import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'
import {
  customerFormSchema,
  emptyCustomerFormValues,
  type CustomerFormValues,
} from '@/app/customers/schemas/customerFormSchema'
import { usePostalCode } from '@/shared/hooks/usePostalCode'
import {
  formatCep,
  formatDocument,
  formatPhone,
} from '@/shared/utils/brazilianDocuments'
import { cn } from '@/lib/utils'

const inputClass =
  'border-industrial-300 text-industrial-900 placeholder:text-industrial-400 focus:border-industrial-500 h-12 w-full rounded-lg border-2 bg-white px-3 text-base focus:outline-none'

const labelClass = 'text-industrial-500 text-xs font-semibold tracking-widest uppercase'

interface CustomerFormProps {
  mode: 'create' | 'edit'
  defaultValues?: Partial<CustomerFormValues>
  onSubmit: (values: CustomerFormValues) => Promise<void>
  isSubmitting?: boolean
}

function toFormState(defaultValues?: Partial<CustomerFormValues>): CustomerFormValues {
  return {
    ...emptyCustomerFormValues,
    ...defaultValues,
    customerType: defaultValues?.customerType ?? 'pf',
    fullName: defaultValues?.fullName ?? '',
    tradeName: defaultValues?.tradeName,
    document: defaultValues?.document,
    email: defaultValues?.email,
    phone: defaultValues?.phone,
    zipCode: defaultValues?.zipCode,
    street: defaultValues?.street,
    number: defaultValues?.number,
    complement: defaultValues?.complement,
    neighborhood: defaultValues?.neighborhood,
    city: defaultValues?.city,
    state: defaultValues?.state,
    instagram: defaultValues?.instagram,
    facebook: defaultValues?.facebook,
    linkedin: defaultValues?.linkedin,
    website: defaultValues?.website,
    notes: defaultValues?.notes,
  }
}

function formatInitialDocument(
  document: string | undefined,
  customerType: 'pf' | 'pj'
): string {
  if (!document) return ''
  return formatDocument(document, customerType)
}

function formatInitialPhone(phone: string | undefined): string {
  if (!phone) return ''
  return formatPhone(phone)
}

function formatInitialCep(zipCode: string | undefined): string {
  if (!zipCode) return ''
  return formatCep(zipCode)
}

export function CustomerForm({
  mode,
  defaultValues,
  onSubmit,
  isSubmitting = false,
}: CustomerFormProps) {
  const { lookupPostalCode, isLoading: isCepLoading } = usePostalCode()
  const initialType = defaultValues?.customerType ?? 'pf'

  const [values, setValues] = useState<CustomerFormValues>(() => toFormState(defaultValues))
  const [documentDisplay, setDocumentDisplay] = useState(() =>
    formatInitialDocument(defaultValues?.document, initialType)
  )
  const [phoneDisplay, setPhoneDisplay] = useState(() => formatInitialPhone(defaultValues?.phone))
  const [zipCodeDisplay, setZipCodeDisplay] = useState(() =>
    formatInitialCep(defaultValues?.zipCode)
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  function updateValue<K extends keyof CustomerFormValues>(key: K, value: CustomerFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    setFieldErrors((current) => {
      const next = { ...current }
      delete next[key as string]
      return next
    })
  }

  async function handleCepBlur() {
    if (!zipCodeDisplay.trim()) return

    const address = await lookupPostalCode(zipCodeDisplay)
    if (!address) return

    updateValue('zipCode', zipCodeDisplay.replace(/\D/g, ''))
    updateValue('street', address.street)
    updateValue('neighborhood', address.neighborhood)
    updateValue('city', address.city)
    updateValue('state', address.state)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setFormError(null)

    const payload: CustomerFormValues = {
      ...values,
      document: documentDisplay.replace(/\D/g, '') || undefined,
      phone: phoneDisplay.replace(/\D/g, '') || undefined,
      zipCode: zipCodeDisplay.replace(/\D/g, '') || undefined,
      tradeName: values.customerType === 'pj' ? values.tradeName : undefined,
    }

    const result = customerFormSchema.safeParse(payload)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !errors[key]) {
          errors[key] = issue.message
        }
      }
      setFieldErrors(errors)
      setFormError('Revise os campos destacados antes de salvar.')
      return
    }

    await onSubmit(result.data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-industrial-900 text-lg font-bold">Identificação</h2>

        <fieldset className="space-y-2">
          <legend className={labelClass}>Tipo de cliente</legend>
          <div className="grid grid-cols-2 gap-3">
            {(['pf', 'pj'] as const).map((type) => (
              <label
                key={type}
                className={cn(
                  'border-industrial-300 flex h-12 cursor-pointer items-center justify-center rounded-lg border-2 text-sm font-bold uppercase transition',
                  values.customerType === type
                    ? 'border-industrial-950 bg-industrial-950 text-white'
                    : 'bg-white text-industrial-600'
                )}
              >
                <input
                  type="radio"
                  name="customerType"
                  value={type}
                  checked={values.customerType === type}
                  onChange={() => {
                    updateValue('customerType', type)
                    setDocumentDisplay('')
                    updateValue('document', undefined)
                    if (type === 'pf') {
                      updateValue('tradeName', undefined)
                    }
                  }}
                  className="sr-only"
                />
                {type === 'pf' ? 'Pessoa física' : 'Pessoa jurídica'}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="space-y-1.5">
          <label htmlFor="fullName" className={labelClass}>
            {values.customerType === 'pj' ? 'Razão social' : 'Nome completo'}
          </label>
          <input
            id="fullName"
            value={values.fullName}
            onChange={(event) => updateValue('fullName', event.target.value)}
            className={inputClass}
            required
          />
          {fieldErrors.fullName && (
            <p className="text-destructive text-sm">{fieldErrors.fullName}</p>
          )}
        </div>

        {values.customerType === 'pj' && (
          <div className="space-y-1.5">
            <label htmlFor="tradeName" className={labelClass}>
              Nome fantasia
            </label>
            <input
              id="tradeName"
              value={values.tradeName ?? ''}
              onChange={(event) => updateValue('tradeName', event.target.value || undefined)}
              className={inputClass}
            />
            {fieldErrors.tradeName && (
              <p className="text-destructive text-sm">{fieldErrors.tradeName}</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="document" className={labelClass}>
            {values.customerType === 'pj' ? 'CNPJ' : 'CPF'}
          </label>
          <input
            id="document"
            inputMode="numeric"
            value={documentDisplay}
            onChange={(event) => {
              const formatted = formatDocument(event.target.value, values.customerType)
              setDocumentDisplay(formatted)
            }}
            placeholder={values.customerType === 'pj' ? '00.000.000/0000-00' : '000.000.000-00'}
            className={inputClass}
          />
          {fieldErrors.document && (
            <p className="text-destructive text-sm">{fieldErrors.document}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-industrial-900 text-lg font-bold">Contato</h2>

        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>
            E-mail
          </label>
          <input
            id="email"
            type="email"
            value={values.email ?? ''}
            onChange={(event) => updateValue('email', event.target.value || undefined)}
            className={inputClass}
          />
          {fieldErrors.email && <p className="text-destructive text-sm">{fieldErrors.email}</p>}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelClass}>
            Telefone
          </label>
          <input
            id="phone"
            inputMode="tel"
            value={phoneDisplay}
            onChange={(event) => setPhoneDisplay(formatPhone(event.target.value))}
            placeholder="(00) 00000-0000"
            className={inputClass}
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-industrial-900 text-lg font-bold">Endereço</h2>

        <div className="space-y-1.5">
          <label htmlFor="zipCode" className={labelClass}>
            CEP
          </label>
          <input
            id="zipCode"
            inputMode="numeric"
            value={zipCodeDisplay}
            onChange={(event) => setZipCodeDisplay(formatCep(event.target.value))}
            onBlur={handleCepBlur}
            placeholder="00000-000"
            className={inputClass}
          />
          {isCepLoading && (
            <p className="text-industrial-500 flex items-center gap-1 text-sm">
              <Icon name="progress_activity" className="animate-spin text-[16px]" />
              Buscando endereço…
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="street" className={labelClass}>
            Logradouro
          </label>
          <input
            id="street"
            value={values.street ?? ''}
            onChange={(event) => updateValue('street', event.target.value || undefined)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="number" className={labelClass}>
              Número
            </label>
            <input
              id="number"
              value={values.number ?? ''}
              onChange={(event) => updateValue('number', event.target.value || undefined)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="complement" className={labelClass}>
              Complemento
            </label>
            <input
              id="complement"
              value={values.complement ?? ''}
              onChange={(event) => updateValue('complement', event.target.value || undefined)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="neighborhood" className={labelClass}>
            Bairro
          </label>
          <input
            id="neighborhood"
            value={values.neighborhood ?? ''}
            onChange={(event) => updateValue('neighborhood', event.target.value || undefined)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-3">
          <div className="space-y-1.5">
            <label htmlFor="city" className={labelClass}>
              Cidade
            </label>
            <input
              id="city"
              value={values.city ?? ''}
              onChange={(event) => updateValue('city', event.target.value || undefined)}
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="state" className={labelClass}>
              UF
            </label>
            <input
              id="state"
              value={values.state ?? ''}
              maxLength={2}
              onChange={(event) =>
                updateValue('state', event.target.value.toUpperCase() || undefined)
              }
              className={inputClass}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-industrial-900 text-lg font-bold">Redes e site</h2>

        {(['instagram', 'facebook', 'linkedin', 'website'] as const).map((field) => (
          <div key={field} className="space-y-1.5">
            <label htmlFor={field} className={labelClass}>
              {field === 'website' ? 'Site' : field.charAt(0).toUpperCase() + field.slice(1)}
            </label>
            <input
              id={field}
              value={values[field] ?? ''}
              onChange={(event) => updateValue(field, event.target.value || undefined)}
              className={inputClass}
            />
            {fieldErrors[field] && (
              <p className="text-destructive text-sm">{fieldErrors[field]}</p>
            )}
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <h2 className="text-industrial-900 text-lg font-bold">Observações</h2>
        <textarea
          value={values.notes ?? ''}
          onChange={(event) => updateValue('notes', event.target.value || undefined)}
          rows={4}
          className={cn(inputClass, 'min-h-28 py-3')}
        />
      </section>

      {formError && (
        <p className="text-destructive flex items-center gap-1.5 text-sm">
          <Icon name="error" className="text-[16px]" />
          {formError}
        </p>
      )}

      <Button type="submit" size="touch-lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando…' : mode === 'create' ? 'Cadastrar cliente' : 'Salvar alterações'}
      </Button>
    </form>
  )
}
