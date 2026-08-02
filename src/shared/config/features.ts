/** true = administração de usuários ativa; false/ausente = todos vão para /campo e o menu de usuários fica oculto. */
export function isUserManagementEnabled(): boolean {
  return import.meta.env.VITE_FEATURE_FLAG_USER_MANAGEMENT === 'true'
}
