import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Icon } from '@/components/ui/icon'

export function CustomerListHeader() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 className="text-industrial-900 text-2xl font-extrabold tracking-tight">Clientes</h1>
        <p className="text-industrial-500 text-sm">Cadastro de compradores PF e PJ</p>
      </div>
      <Button render={<Link to="/clientes/novo" />} size="touch">
        <Icon name="add" className="text-[20px]" />
        Novo
      </Button>
    </div>
  )
}
