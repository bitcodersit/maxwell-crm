import 'dotenv/config'

import { PrismaClient } from './client/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { hashPassword } from 'nuxt-auth-utils/runtime/server/utils/password'

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.NUXT_DATABASE_HOST,
    user: process.env.NUXT_DATABASE_USER,
    password: process.env.NUXT_DATABASE_PASSWORD,
    database: process.env.NUXT_DATABASE_NAME,
    port: Number(process.env.NUXT_DATABASE_PORT),
  }),
})

async function main() {
  const roles = ['Super Admin', 'Admin', 'Manager', 'Salesman', 'Accountant']
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role,
      },
      update: {},
      create: {
        name: role,
      },
    })
  }

  const operations = ['create', 'read', 'update', 'delete']
  const modules = ['user', 'role', 'permission']
  const subjects = ['any', 'own']

  const permissions = operations.flatMap((operation) =>
    modules.flatMap((module) =>
      subjects.map((subject) => ({
        slug: `${operation}-${subject}-${module}`,
        name: capitalize(`${operation} ${subject} ${module}`),
      }))
    )
  )

  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: {
        slug: permission.slug,
      },
      update: {},
      create: permission,
    })
  }
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
