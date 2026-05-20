import { setAuditRequestContext } from '~~/server/utils/audit/context'

export default defineEventHandler(async event => {
  setAuditRequestContext({
    userId: (await getUserSession(event)).user?.id,
    ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? undefined,
    userAgent: getHeader(event, 'user-agent') ?? undefined,
    metadata: {
      method: event.method,
      path: getRequestURL(event).pathname
    }
  })
})
