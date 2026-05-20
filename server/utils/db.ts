import { PrismaClient } from '@@/prisma/client/client'
import { auditLogExtension } from '@explita/prisma-audit-log'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { getAuditRequestContext } from './audit/context'
import { createSingleton } from './singleton'

export const prisma = createSingleton('prisma', () => {
  const client = new PrismaClient({
    adapter: new PrismaMariaDb({
      host: process.env.NUXT_DATABASE_HOST,
      user: process.env.NUXT_DATABASE_USER,
      password: process.env.NUXT_DATABASE_PASSWORD,
      database: process.env.NUXT_DATABASE_NAME,
      port: Number(process.env.NUXT_DATABASE_PORT),
      allowPublicKeyRetrieval: true
    })
  })

  return client.$extends(
    auditLogExtension({
      getContext: () => (getAuditRequestContext() ?? {}) as any,
      maskFields: ['password', 'token'],
      excludeModels: ['AuditLog']
    })
  )
})
