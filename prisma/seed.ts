import 'dotenv/config'

import { PrismaClient } from './client/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.NUXT_DATABASE_HOST,
    user: process.env.NUXT_DATABASE_USER,
    password: process.env.NUXT_DATABASE_PASSWORD,
    database: process.env.NUXT_DATABASE_NAME,
    port: Number(process.env.NUXT_DATABASE_PORT),
    allowPublicKeyRetrieval: true,
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

  const operations = ['create', 'read', 'update', 'delete', 'export']
  const modules = ['users', 'roles', 'permissions', 'teams', 'attachments']
  const subjects = ['any', 'own']

  const permissionsData = operations.flatMap((operation) =>
    modules.flatMap((module) =>
      subjects.map((subject) => ({
        name: `${operation}-${subject}-${module}`,
      }))
    )
  )

  const permissions = await Promise.all(
    permissionsData.map((permission) =>
      prisma.permission.upsert({
        where: {
          name: permission.name,
        },
        update: {},
        create: permission,
      })
    )
  )

  const superAdminRole = await prisma.role.findUnique({
    where: {
      name: 'Super Admin',
    },
  })
  if (superAdminRole) {
    await Promise.all(
      permissions.map((permission) =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: permission.id,
          },
        })
      )
    )
  }

  const superAdminEmail = process.env.NUXT_SUPER_ADMIN_EMAIL
  const superAdminPassword = process.env.NUXT_SUPER_ADMIN_PASSWORD

  if (superAdminEmail && superAdminPassword) {
    await prisma.user.upsert({
      where: {
        email: superAdminEmail,
      },
      update: {},
      create: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        userRoles: {
          create: {
            roleId: superAdminRole.id,
          },
        },
      },
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
