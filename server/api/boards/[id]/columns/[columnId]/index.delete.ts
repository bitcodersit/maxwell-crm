import { z } from 'zod'

const zColumnDelete = z.object({
  moveToColumnId: z.number().int().positive().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  const columnId = Number(getRouterParam(event, 'columnId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()
  if (!Number.isInteger(columnId) || columnId < 1) throw err.notFound()

  const input = await validate(await readBody(event), zColumnDelete)
  return deleteBoardColumn(boardId, columnId, input)
})
