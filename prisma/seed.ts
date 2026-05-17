import 'dotenv/config'

import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { generateKeyBetween } from 'fractional-indexing'
import { PrismaClient } from './client/client'

const prisma = new PrismaClient({
  adapter: new PrismaMariaDb({
    host: process.env.NUXT_DATABASE_HOST,
    user: process.env.NUXT_DATABASE_USER,
    password: process.env.NUXT_DATABASE_PASSWORD,
    database: process.env.NUXT_DATABASE_NAME,
    port: Number(process.env.NUXT_DATABASE_PORT),
    allowPublicKeyRetrieval: true
  })
})

async function main() {
  const roles = ['Super Admin', 'Admin', 'Manager', 'Salesman', 'Accountant', 'Customer']
  for (const role of roles) {
    await prisma.role.upsert({
      where: {
        name: role
      },
      update: {},
      create: {
        name: role
      }
    })
  }

  const operations = ['create', 'read', 'update', 'delete', 'export']
  const modules = ['users', 'roles', 'permissions', 'teams', 'attachments', 'tasks']
  const subjects = ['any', 'own']

  const permissionsData = operations.flatMap(operation =>
    modules.flatMap(module =>
      subjects.map(subject => ({
        name: `${operation}-${subject}-${module}`
      }))
    )
  )

  const permissions = await Promise.all(
    permissionsData.map(permission =>
      prisma.permission.upsert({
        where: {
          name: permission.name
        },
        update: {},
        create: permission
      })
    )
  )

  const superAdminRole = await prisma.role.findUnique({
    where: {
      name: 'Super Admin'
    }
  })
  if (superAdminRole) {
    await Promise.all(
      permissions.map(permission =>
        prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: superAdminRole.id,
              permissionId: permission.id
            }
          },
          update: {},
          create: {
            roleId: superAdminRole.id,
            permissionId: permission.id
          }
        })
      )
    )
  }

  const superAdminEmail = process.env.NUXT_SUPER_ADMIN_EMAIL
  const superAdminPassword = process.env.NUXT_SUPER_ADMIN_PASSWORD

  if (superAdminEmail && superAdminPassword) {
    await prisma.user.upsert({
      where: {
        email: superAdminEmail
      },
      update: {},
      create: {
        name: 'Super Admin',
        email: superAdminEmail,
        password: superAdminPassword,
        userRoles: {
          create: {
            roleId: superAdminRole.id
          }
        }
      }
    })
  }

  const taskStatuses = [
    { name: 'Todo', color: '#94a3b8' },
    { name: 'In Progress', color: '#38bdf8' },
    { name: 'In Review', color: '#f59e0b' },
    { name: 'Completed', color: '#10b981' },
    { name: 'Failed', color: '#ef4444' },
    { name: 'Cancelled', color: '#64748b' }
  ]

  const board = await prisma.board.upsert({
    where: {
      name: 'tasks-default'
    },
    update: {},
    create: {
      name: 'tasks-default',
      columns: {
        create: taskStatuses.reduce((acc, status) => {
          return [
            ...acc,
            {
              name: status.name,
              color: status.color,
              sortOrder: generateKeyBetween(acc.at(-1)?.sortOrder)
            }
          ]
        }, [])
      }
    },
    include: {
      columns: true
    }
  })

  // Find all tasks that are not assigned to the board and assign them to the board
  const tasks = await prisma.task.findMany({
    where: {
      deletedAt: null,
      boardItems: {
        none: {
          boardId: board.id
        }
      }
    }
  })

  const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)

  await prisma.boardItem.createMany({
    data: tasks.reduce((acc, task) => {
      return [
        ...acc,
        {
          boardId: board.id,
          taskId: task.id,
          columnId: board.columns.find(
            column =>
              column.name ===
              task.status
                .toLowerCase()
                .split('_')
                .map(word => capitalize(word))
                .join(' ')
          )?.id,
          sortOrder: generateKeyBetween(acc.at(-1)?.sortOrder)
        }
      ]
    }, [])
  })
}
main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async e => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
