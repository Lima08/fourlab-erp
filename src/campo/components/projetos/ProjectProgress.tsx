import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'

interface Props {
  completedItems: number
  totalItems: number
}

export function ProjectProgress({ completedItems, totalItems }: Props) {
  const value = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)

  return (
    <Progress value={value}>
      <ProgressLabel>Progresso da Vistoria</ProgressLabel>
      <ProgressValue>{() => `${completedItems} / ${totalItems} itens`}</ProgressValue>
    </Progress>
  )
}
