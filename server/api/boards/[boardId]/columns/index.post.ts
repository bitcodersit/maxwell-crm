import { z } from 'zod'

const zColumnPost = z.object({
  name: z.string().trim().min(1),
  color: z.string().trim().max(32).nullish()
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
    select: { id: true }
  })
  if (!board) throw err.notFound()

  const input = await validate(await readBody(event), zColumnPost)
  return createBoardColumn(boardId, input)
})
