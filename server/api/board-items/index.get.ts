import { getLeadWhere, selectLeadForBoardCard, zGetLeads } from '~~/server/utils/leads'

const zGetBoardItems = z
  .object({
    columnId: zId().nullish()
  })
  .and(zGetLeads)

export default defineEventHandler(async event => {
  await getCurrentUser(event)

  const query = getQuery(event)
  const input = await validate(query, zGetBoardItems)

  const where: Prisma.BoardItemWhereInput = {}
  if (input.columnId) where.columnId = Number(input.columnId)

  const leadWhere = getLeadWhere(input)
  // Only constrain by lead when list filters are applied (keeps task boards unaffected)
  if (leadWhere.AND) {
    where.lead = { is: leadWhere }
  }

  const { skip, take, paginate } = getPagination(input)

  const [total, items] = await prisma.$transaction([
    prisma.boardItem.count({ where }),
    prisma.boardItem.findMany({
      skip,
      take,
      where,
      orderBy: {
        sortOrder: 'asc'
      },
      include: {
        task: true,
        lead: {
          include: selectLeadForBoardCard
        }
      }
    })
  ])

  return paginate(items, total)
})

