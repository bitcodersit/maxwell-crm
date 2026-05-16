import { z } from 'zod'

const zItemMove = z.object({
  columnId: z.number().int().positive(),
  beforeItemId: z.number().int().positive().nullish(),
  afterItemId: z.number().int().positive().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  const itemId = Number(getRouterParam(event, 'itemId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()
  if (!Number.isInteger(itemId) || itemId < 1) throw err.notFound()

  const input = await validate(await readBody(event), zItemMove)
  return moveBoardItem(boardId, itemId, input)
})
