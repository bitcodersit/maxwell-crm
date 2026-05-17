import { z } from 'zod'

const zSchema = z.object({
  a: z.string().nullish(),
  b: z.string().nullish()
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
      sortOrder: getSortOrder(input.a, input.b)
    },
    select: {
      sortOrder: true
    }
  })
})
