export type InstallmentStatus = 'pending' | 'paid' | 'overdue' | 'canceled'
export type EffectiveInstallmentStatus = InstallmentStatus

export function getEffectiveInstallmentStatus(
  status: InstallmentStatus,
  dueDate: string,
  today: string
): EffectiveInstallmentStatus {
  if (status === 'pending' && dueDate < today) {
    return 'overdue'
  }
  return status
}
