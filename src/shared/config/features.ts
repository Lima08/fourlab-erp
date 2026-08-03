/** true = administração de usuários ativa (Edge Functions + UI futura). */
export function isUserManagementEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_FLAG_USER_MANAGEMENT === 'true'
}
