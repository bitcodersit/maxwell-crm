import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

const host = env('NUXT_DATABASE_HOST')
const port = env('NUXT_DATABASE_PORT')
const user = env('NUXT_DATABASE_USER')
const password = env('NUXT_DATABASE_PASSWORD')
const database = env('NUXT_DATABASE_NAME')

const url = `mysql://${user}:${password}@${host}:${port}/${database}?ssl-mode=REQUIRED&allowPublicKeyRetrieval=true`

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url,
  },
})
