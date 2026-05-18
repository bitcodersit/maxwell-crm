import z from 'zod'
import { zId } from '~~/server/utils/z'

type TZPatchSchema = z.infer<typeof zPatchSchema>
const zPatchSchema = z.object({
  id: zId(),
  name: zName().nullish(),
  color: zColor().nullish(),
  pinned: z.boolean().nullish(),
  boardId: zId().nullish()
})

type TZPostSchema = z.infer<typeof zPostSchema>
const zPostSchema = z.object({
  name: zName(),
  color: zColor().nullish(),
  boardId: zId()
})

const zSchema = z.union([zPatchSchema, zPostSchema])

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const body = await readBody(event)
  const input = await validate(body, zSchema)
  console.log(input, 'id' in input, 'id' in input && input.id)

  if ('id' in input && input.id) {
    const { id, ...rest } = input as TZPatchSchema
    const data: Prisma.BoardColumnUpdateInput = {}
    if (rest.name) data.name = rest.name
    if (rest.color) data.color = rest.color
    if (typeof rest.pinned === 'boolean') data.pinned = rest.pinned
    if (rest.boardId) data.board = { connect: { id: rest.boardId } }
    return prisma.boardColumn.update({
      data,
      where: {
        id
      }
    })
  }
  const rest = input as TZPostSchema
  const lastColumn = await prisma.boardColumn.findFirst({
    where: {
      boardId: rest.boardId,
      deletedAt: null
    },
    select: { sortOrder: true },
    orderBy: { sortOrder: 'desc' }
  })
  return prisma.boardColumn.create({
    data: {
      name: rest.name,
      color: rest.color,
      boardId: rest.boardId,
      sortOrder: getSortOrder(lastColumn?.sortOrder ?? null, null)
    }
  })
})
