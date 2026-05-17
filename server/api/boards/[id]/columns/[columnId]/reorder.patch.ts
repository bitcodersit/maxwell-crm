import { generateKeyBetween } from 'fractional-indexing'
import { z } from 'zod'

const zSchema = z.object({
  beforeSortOrder: z.string().nullish(),
  afterSortOrder: z.string().nullish()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const input = await validate(await readBody(event), zSchema)

  const columnId = Number(getRouterParam(event, 'columnId'))
  if (isNaN(columnId) || columnId < 1) throw err.notFound()

  return prisma.boardColumn.update({
    where: {
      id: columnId
    },
    data: {
      sortOrder: generateKeyBetween(input.beforeSortOrder ?? null, input.afterSortOrder ?? null)
    }
  })
})
