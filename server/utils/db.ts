import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@@/prisma/client/client'
import { createSingleton } from './singleton'

export const prisma = createSingleton('prisma', () => {
  return new PrismaClient({
    adapter: new PrismaMariaDb({
      host: process.env.NUXT_DATABASE_HOST,
      user: process.env.NUXT_DATABASE_USER,
      password: process.env.NUXT_DATABASE_PASSWORD,
      database: process.env.NUXT_DATABASE_NAME,
      port: Number(process.env.NUXT_DATABASE_PORT),
      allowPublicKeyRetrieval: true
    })
  })
})
