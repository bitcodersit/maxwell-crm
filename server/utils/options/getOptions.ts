import type { TZGetOptions } from './zod'

export const getOptions = async (input: TZGetOptions) => {
  const where: Prisma.OptionWhereInput = {
    type: input.type,
    deletedAt: null
  }

  if (input.q) {
    where.name = {
      contains: input.q
    }
  }

  const { orderBy } = getOrderBy(input)
  const { skip, take, paginate } = getPagination(input)

  const [count, data] = await prisma.$transaction([
    prisma.option.count({ where }),
    prisma.option.findMany({
      skip,
      take,
      where,
      orderBy,
      select: {
        id: true,
        name: true
      }
    })
  ])

  return paginate(data, count)
}
