import { defineConfig, env } from 'prisma/config'
import 'dotenv/config'

const url = `mysql://${env('NUXT_DATABASE_USER')}:${env('NUXT_DATABASE_PASSWORD')}@${env(
  'NUXT_DATABASE_HOST'
)}:${env('NUXT_DATABASE_PORT')}/${env('NUXT_DATABASE_NAME')}?ssl-mode=REQUIRED`

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
