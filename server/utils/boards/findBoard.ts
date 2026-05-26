import z from 'zod'
import { zBoolean } from '../zod'

export type TZFindBoardQuery = z.infer<typeof zFindBoardQuery>
export const zFindBoardQuery = z.object({
  module: z.enum(BoardModule),
  name: z.string().trim().optional(),
  isDefault: zBoolean().optional()
})

export const findBoard = async (input: TZFindBoardQuery) => {
  //
  const where: Prisma.BoardWhereInput = {
    deletedAt: null
  }

  if (input.module) where.module = input.module
  if (input.name) where.name = input.name
  if (typeof input.isDefault === 'boolean') {
    where.isDefault = input.isDefault
  }

  const board = await prisma.board.findFirst({
    where,
    include: {
      columns: {
        where: {
          deletedAt: null
        },
        orderBy: [
          {
            pinned: 'desc'
          },
          {
            sortOrder: 'asc'
          }
        ],
        include: {
          _count: {
            select: {
              items: true
            }
          }
        }
      }
    }
  })

  if (!board) {
    return {
      data: null,
      error: err.notFound()
    }
  }

  return {
    data: board,
    error: null
  }
}
