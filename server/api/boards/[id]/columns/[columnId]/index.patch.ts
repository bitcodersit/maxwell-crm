import { z } from 'zod'

const zColumnPatch = z.object({
  name: z.string().trim().min(1).optional(),
  color: z.string().trim().max(32).nullish(),
  pinned: z.boolean().optional()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const boardId = Number(getRouterParam(event, 'boardId'))
  const columnId = Number(getRouterParam(event, 'columnId'))
  if (!Number.isInteger(boardId) || boardId < 1) throw err.notFound()
  if (!Number.isInteger(columnId) || columnId < 1) throw err.notFound()

  const input = await validate(await readBody(event), zColumnPatch)
  return updateBoardColumn(boardId, columnId, input)
})
