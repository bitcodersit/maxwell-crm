import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { generateKeyBetween } from 'fractional-indexing'
import { PrismaClient } from './client/client'
import { BoardModule } from './client/enums'

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

type BoardColumn = {
  name: string
  color: string
  isDefault?: boolean
}

type Board = {
  name: string
  module: BoardModule
  isDefault?: boolean
  columns: BoardColumn[]
}

const createBoard = async (input: Board) => {
  const board = await prisma.board.findFirst({
    where: {
      name: input.name,
      module: input.module
    }
  })

  const columns = input.columns.reduce(
    (acc, column) => {
      return [
        ...acc,
        {
          name: column.name,
          color: column.color,
          isDefault: column.isDefault,
          sortOrder: generateKeyBetween(acc.at(-1)?.sortOrder, null)
        }
      ]
    },
    [] as {
      name: string
      color: string
      sortOrder: string
      isDefault?: boolean
    }[]
  )

  if (!board) {
    return prisma.board.create({
      data: {
        name: input.name,
        module: input.module,
        isDefault: input.isDefault,
        columns: {
          create: columns
        }
      },
      include: {
        columns: true
      }
    })
  }

  return prisma.board.update({
    where: { id: board.id },
    data: {
      isDefault: input.isDefault,
      columns: {
        upsert: columns.map(column => ({
          where: {
            boardId_name: {
              boardId: board.id,
              name: column.name
            }
          },
          update: column,
          create: column
        }))
      }
    },
    include: {
      columns: true
    }
  })
}

const seedTasksBoard = async () => {
  const board = await createBoard({
    name: 'default',
    module: BoardModule.TASKS,
    isDefault: true,
    columns: [
      { name: 'Todo', color: '#94a3b8', isDefault: true },
      { name: 'In Progress', color: '#38bdf8' },
      { name: 'In Review', color: '#f59e0b' },
      { name: 'Completed', color: '#10b981' },
      { name: 'Failed', color: '#ef4444' },
      { name: 'Cancelled', color: '#64748b' }
    ]
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

const seedLeadsBoard = async () => {
  const board = await createBoard({
    name: 'default',
    module: BoardModule.LEADS,
    isDefault: true,
    columns: [
      { name: 'New', color: '#94a3b8', isDefault: true }, // slate (neutral)
      { name: 'Contacted', color: '#38bdf8' }, // sky (info/active)
      { name: 'Qualified', color: '#f59e0b' }, // amber (attention)
      { name: 'Prospect', color: '#10b981' }, // emerald (progress)
      { name: 'Visit Scheduled', color: '#f59e0b' }, // amber (upcoming/action needed)
      { name: 'Visit Done', color: '#38bdf8' }, // sky (progress)
      { name: 'Negotiation', color: '#6366f1' }, // indigo (discussion)
      { name: 'Booking', color: '#06b6d4' }, // cyan (booked)
      { name: 'Sold', color: '#22c55e' }, // green (sold)
      { name: 'Closed Lost', color: '#ef4444' } // red (lost)
    ]
  })

  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      boardItems: {
        none: {
          boardId: board.id
        }
      }
    }
  })

  await prisma.boardItem.createMany({
    data: leads.reduce((acc, lead) => {
      return [
        ...acc,
        {
          boardId: board.id,
          leadId: lead.id,
          columnId: board.columns[0].id,
          sortOrder: generateKeyBetween(acc.at(-1)?.sortOrder)
        }
      ]
    }, [])
  })
}

const seedBoards = async () => {
  await seedTasksBoard()
  await seedLeadsBoard()
}

const seedOptions = async () => {
  const items = [
    {
      type: 'SOURCE',
      options: ['Facebook', 'Website', 'Phone', 'Referral', 'Walk-in']
    },
    {
      type: 'PROPERTY_TYPE_MAIN',
      options: ['Land', 'Land Share', 'Commercial Plot']
    },
    {
      type: 'PROPERTY_TYPE_SUB',
      options: ['Ready', 'Ongoing', 'Installment']
    },
    {
      type: 'SIZE',
      options: ['Katha', 'Sqft']
    },
    {
      type: 'PROPERTY_PURCHASE_TYPE',
      options: ['Contracted for sale', 'Power Registration', 'Sab Kobla', 'Ongoing']
    },
    {
      type: 'BILL_TYPE',
      options: ['Conveyance', 'Advance', 'Other']
    }
  ]
  await prisma.option.createMany({
    skipDuplicates: true,
    data: items.flatMap(item =>
      item.options.map(name => ({
        name,
        type: item.type
      }))
    )
  })
}

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
  const modules = [
    'users',
    'roles',
    'permissions',
    'teams',
    'attachments',
    'tasks',
    'leads',
    'bills'
  ]
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

  await seedBoards()
  await seedOptions()
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
