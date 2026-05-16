import type { Prisma } from '~~/prisma/client/client'
import { BoardModule } from '~~/prisma/client/enums'
import { bootstrapModuleBoards } from './bootstrap'

const boardBaseWhere = {
  deletedAt: null
} satisfies Prisma.BoardWhereInput

export const listBoards = async (module: BoardModule) => {
  await bootstrapModuleBoards(module)
  return prisma.board.findMany({
    where: {
      ...boardBaseWhere,
      module
    },
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
    select: {
      id: true,
      module: true,
      name: true,
      slug: true,
      _count: {
        select: {
          columns: {
            where: { deletedAt: null }
          },
          items: true
        }
      }
    }
  })
}

export const getBoardById = async (boardId: number) => {
  const board = await prisma.board.findFirst({
    where: {
      ...boardBaseWhere,
      id: boardId
    },
    include: {
      columns: {
        where: { deletedAt: null },
        orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          _count: {
            select: {
              items: true
            }
          }
        }
      },
      items: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
      }
    }
  })
  if (!board) throw err.notFound()
  return board
}

export const getBoardBySlug = async (module: BoardModule, slug: string) => {
  await bootstrapModuleBoards(module)
  const board = await prisma.board.findFirst({
    where: {
      ...boardBaseWhere,
      module,
      slug
    },
    include: {
      columns: {
        where: { deletedAt: null },
        orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }],
        include: {
          _count: {
            select: {
              items: true
            }
          }
        }
      },
      items: {
        orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
      }
    }
  })
  if (!board) throw err.notFound()
  return board
}
