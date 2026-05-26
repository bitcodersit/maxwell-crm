export type TAuditRequestContext = {
  userId?: number
  ipAddress?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

const KEY = 'auditRequestContext'

export const setAuditRequestContext = (context: TAuditRequestContext) => {
  return useStorage().setItem<TAuditRequestContext>(KEY, context)
}

export const getAuditRequestContext = () => {
  return useStorage().getItem<TAuditRequestContext>(KEY)
}
