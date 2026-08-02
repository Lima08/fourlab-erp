import { Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent } from '@/components/ui/dialog'
import { Icon } from '@/components/ui/icon'

import { useClients } from '@/plataforma/hooks/useClients'
import { useProjectFormState } from '@/plataforma/hooks/useProjectFormState'
import { UF_OPTIONS, UPLOAD_TYPE_OPTIONS } from '@/plataforma/constants/addProject'
import { usePostalCode } from '@/plataforma/hooks/usePostalCode'
import { formatPhone } from '@/shared/utils/formatPhone'
import { StepForm, type StepField } from './StepForm'
import { StepHeader } from './StepHeader'
import { UploadFileSelectType } from './UploadFileSelectType'
import { UploadFileInput } from './UploadFileInput'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddProjectModal({ open, onOpenChange }: Props) {
  const {
    step,
    values,
    fieldErrors,
    clientValues,
    clientFieldErrors,
    uploadType,
    file,
    isCreating,
    isCreatingClient,
    canFinish,
    setUploadType,
    patchValues,
    patchClientValues,
    handleClose,
    handleContinueClientStep,
    handleCreateClient,
    handleContinueStep1,
    handleContinueStep2,
    handleBack,
    addFile,
    removeFile,
    handleFinish,
  } = useProjectFormState({ onOpenChange })

  const { data: clients } = useClients()
  const { search } = usePostalCode()

  const handlePostalCodeSearch = async (postalCode: string) => {
    const address = await search(postalCode)

    if (!address) return

    patchValues(address)
  }

  const handlePostalCodeBlur = () => handlePostalCodeSearch(values.postal_code)

  const handlePostalCodeChange = (value: string) => {
    patchValues({ postal_code: value })

    if (value.replace(/\D/g, '').length === 8) {
      void handlePostalCodeSearch(value)
    }
  }

  const stepOneFields = [
    {
      id: 'client-name',
      label: 'Nome do cliente',
      value: clientValues.name,
      onChange: (value: string) => patchClientValues({ name: value }),
      error: clientFieldErrors.name,
    },

    {
      id: 'client-phone',
      label: 'Telefone do cliente',
      value: clientValues.phone,
      onChange: (value: string) => patchClientValues({ phone: formatPhone(value) }),
      error: clientFieldErrors.phone,
    },
  ]

  const stepTwoFields: StepField[] = [
    {
      id: 'project-name',
      label: 'Nome do projeto',
      value: values.name,
      onChange: (value: string) => patchValues({ name: value }),
      error: fieldErrors.name,
    },

    {
      id: 'project-description',
      label: 'Descrição do projeto',
      value: values.description,
      onChange: (value: string) => patchValues({ description: value }),
      error: fieldErrors.description,
    },

    {
      id: 'project-total-area',
      label: 'Área total (m²)',
      type: 'number',
      min: '0',
      step: '0.01',
      value: values.total_area === 0 ? '' : values.total_area,
      onChange: (value: string) => patchValues({ total_area: Number(value) }),
      error: fieldErrors.total_area,
    },

    {
      id: 'project-responsible-client',
      label: 'Cliente responsável',
      type: 'select',
      placeholder: 'Selecione um cliente',
      value: values.responsible_client,
      onChange: (value: string) => patchValues({ responsible_client: value }),
      options: clients?.map((client) => ({ value: client.id, label: client.name })),
      error: fieldErrors.responsible_client,
    },
  ]

  const stepThreeFields: StepField[] = [
    {
      id: 'project-postal-code',
      label: 'CEP',
      value: values.postal_code,
      onBlur: handlePostalCodeBlur,
      onChange: handlePostalCodeChange,
      error: fieldErrors.postal_code,
      span: 'full',
    },

    {
      id: 'project-street',
      label: 'Rua',
      value: values.street,
      onChange: (value: string) => patchValues({ street: value }),
      error: fieldErrors.street,
      span: 'full',
    },

    {
      id: 'project-number',
      label: 'Número',
      value: values.number,
      onChange: (value: string) => patchValues({ number: value }),
      error: fieldErrors.number,
      span: 'half',
    },

    {
      id: 'project-complement',
      label: 'Complemento',
      value: values.complement,
      onChange: (value: string) => patchValues({ complement: value }),
      error: fieldErrors.complement,
      span: 'half',
    },

    {
      id: 'project-neighborhood',
      label: 'Bairro',
      value: values.neighborhood,
      onChange: (value: string) => patchValues({ neighborhood: value }),
      error: fieldErrors.neighborhood,
      span: 'half',
    },

    {
      id: 'project-city',
      label: 'Cidade',
      value: values.city,
      onChange: (value: string) => patchValues({ city: value }),
      error: fieldErrors.city,
      span: 'half',
    },

    {
      id: 'project-state',
      label: 'Estado',
      type: 'select',
      placeholder: 'UF',
      value: values.state,
      onChange: (value: string) => patchValues({ state: value }),
      options: UF_OPTIONS.map((uf) => ({ value: uf, label: uf })),
      error: fieldErrors.state,
      span: 'half',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex top max-h-158px flex-col gap-0 bg-white p-0 sm:max-w-lg scale-90 origin-center"
      >
        <div className="border-industrial-200 flex shrink-0 items-center justify-between border-b px-6 py-4">
          <h2 className="text-industrial-900 text-lg font-bold">Novo projeto</h2>
          <DialogClose
            render={
              <button
                type="button"
                disabled={isCreating}
                className="text-industrial-500 hover:bg-industrial-100 flex size-10 items-center justify-center rounded-full transition-colors"
                aria-label="Fechar modal"
              />
            }
          >
            <Icon name="close" className="text-[22px]" />
          </DialogClose>
        </div>

        <StepHeader step={step}/>

        {step === 1 && (
          <StepForm
            fields={stepOneFields}
            onSubmit={handleContinueClientStep}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateClient}
                  disabled={isCreatingClient}
                >
                  {isCreatingClient && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                  Adicionar Cliente
                </Button>
                <Button type="submit">Continuar</Button>
              </>
            }
          />
        )}

        {step === 2 && (
          <StepForm
            fields={stepTwoFields}
            onSubmit={handleContinueStep1}
            footer={
              <>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
                <Button type="submit">Continuar</Button>
              </>
            }
          />
        )}

        {step === 3 && (
          <StepForm
            fields={stepThreeFields}
            layout="grid"
            onSubmit={handleContinueStep2}
            footer={
              <>
                <Button type="button" variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
                <Button type="submit">Continuar</Button>
              </>
            }
          />
        )}

        {step === 4 && (
          <div className="flex flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              <UploadFileSelectType
                label="Tipo de documento"
                options={UPLOAD_TYPE_OPTIONS}
                value={uploadType}
                onChange={setUploadType}
              />

              <UploadFileInput
                id="project-documents"
                label="Documento (PDF)"
                accept="application/pdf"
                disabled={!uploadType}
                placeholder="Toque para selecionar um arquivo PDF"
                disabledMessage="Selecione um tipo de documento primeiro"
                file={file}
                fileIcon="picture_as_pdf"
                onAdd={addFile}
                onRemove={removeFile}
              />
            </div>

            <div className="border-industrial-200 rounded-b-xl bg-industrial-50 flex shrink-0 flex-col-reverse gap-2 border-t p-4 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleBack}>
                Voltar
              </Button>
              <Button type="button" onClick={handleFinish} disabled={!canFinish}>
                {isCreating && <Loader2Icon className="mr-2 size-4 animate-spin" />}
                Concluir
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
