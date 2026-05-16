import { z } from 'zod'

const zBoardPost = z.object({
  module: z.enum(['leads', 'tasks']),
  name: z.string().trim().min(1),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  columns: z
    .array(
      z.object({
        name: z.string().trim().min(1),
        color: z.string().trim().max(32).nullish(),
        pinned: z.boolean().optional().default(false)
      })
    )
    .optional()
})

export default defineEventHandler(async event => {
  await requireUserSession(event)

  const input = await validate(await readBody(event), zBoardPost)
  const module = getBoardModuleFromParam(input.module)
  if (!module) throw err.notFound()

  const columns = input.columns || []
  const sortedColumns = [...columns.filter(v => v.pinned), ...columns.filter(v => !v.pinned)]
  const sortOrders = computeSortOrderBatch(sortedColumns.length)

  return prisma.board.create({
    data: {
      module,
      name: input.name,
      slug: input.slug,
      columns: {
        create: sortedColumns.map((column, index) => ({
          name: column.name,
          color: column.color || null,
          pinned: !!column.pinned,
          sortOrder:
            sortOrders.at(index) ?? computeSortOrder(sortOrders.at(index - 1) ?? null, null)
        }))
      }
    },
    include: {
      columns: {
        where: { deletedAt: null },
        orderBy: [{ pinned: 'desc' }, { sortOrder: 'asc' }, { id: 'asc' }]
      }
    }
  })
})
