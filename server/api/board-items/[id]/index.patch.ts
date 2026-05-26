const zPatchBoardItem = z.object({
  columnId: z.number().nullish(),
  sortOrder: z
    .union([z.string().min(1, 'Sort order is required!'), z.array(z.string().nullable()).length(2)])
    .nullish()
})

export default defineEventHandler(async event => {
  await getCurrentUser(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) throw err.notFound()

  const body = await readBody(event)
  const input = await validate(body, zPatchBoardItem)

  const data: Prisma.BoardItemUpdateInput = {}
  if (input.columnId) {
    data.column = {
      connect: {
        id: input.columnId
      }
    }
  }
  if (input.sortOrder) {
    if (Array.isArray(input.sortOrder)) {
      const [a, b] = input.sortOrder
      data.sortOrder = getSortOrder(a, b)
    } else {
      data.sortOrder = input.sortOrder
    }
  }

  return prisma.boardItem.update({
    data,
    where: {
      id
    }
  })
})
