import { z } from 'zod'

const zItemPost = z.object({
  leadId: z.number().int().positive().nullish(),
  taskId: z.number().int().positive().nullish(),
  columnId: z.number().int().positive().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()

  const board = await prisma.board.findFirst({
    where: {
      id: boardId,
      deletedAt: null
    },
    select: {
      id: true,
      module: true
    }
  })
  if (!board) throw err.notFound()

  const input = await validate(await readBody(event), zItemPost)
  return createBoardItem(board, input)
})
