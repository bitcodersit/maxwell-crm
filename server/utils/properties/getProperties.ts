import type { Prisma } from '~~/prisma/client/client'
import { getOrderBy } from '../getOrderBy'
import { getPagination } from '../getPagination'
import type { TZGetProperties } from './zod'

const getPropertyOrderBy = (input: TZGetProperties): Prisma.PropertyOrderByWithRelationInput[] => {
  const { orderBy } = getOrderBy(input, { id: 'desc' })
  const rows = Array.isArray(orderBy) ? orderBy : orderBy ? [orderBy] : []
  const mapped: Prisma.PropertyOrderByWithRelationInput[] = []
  for (const row of rows) {
    for (const [key, direction] of Object.entries(row || {})) {
      if (direction !== 'asc' && direction !== 'desc') continue
      if (key === 'purchaseType') {
        mapped.push({
          purchaseType: {
            name: direction
          }
        })
        continue
      }
      if (
        ['id', 'sid', 'name', 'status', 'facing', 'price', 'previousPrice', 'createdAt', 'updatedAt'].includes(
          key
        )
      ) {
        mapped.push({
          [key]: direction
        } as Prisma.PropertyOrderByWithRelationInput)
      }
    }
  }
  return mapped.length ? mapped : [{ id: 'desc' }]
}

const getPropertyWhere = (input: TZGetProperties): Prisma.PropertyWhereInput => {
  const and: Prisma.PropertyWhereInput[] = [{ deletedAt: null }]

  if (input.id?.length) and.push({ id: { in: input.id } })
  if (input.status?.length) and.push({ status: { in: input.status } })
  if (input.purchaseTypeId?.length) and.push({ purchaseTypeId: { in: input.purchaseTypeId } })
  if (input.name) and.push({ name: { contains: input.name } })
  if (input.q) {
    and.push({
      OR: [
        { sid: { contains: input.q } },
        { name: { contains: input.q } },
        { facing: { contains: input.q } },
        { purchaseType: { is: { name: { contains: input.q } } } },
        { address: { is: { name: { contains: input.q } } } },
        { address: { is: { addressLine1: { contains: input.q } } } },
        { address: { is: { road: { contains: input.q } } } },
        { address: { is: { block: { contains: input.q } } } }
      ]
    })
  }

  return and.length > 1 ? { AND: and } : and[0]!
}

export const getProperties = async (input: TZGetProperties) => {
  const { take, skip, paginate } = getPagination(input)
  const where = getPropertyWhere(input)
  const orderBy = getPropertyOrderBy(input)

  const [total, items] = await prisma.$transaction([
    prisma.property.count({ where }),
    prisma.property.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        purchaseType: {
          select: {
            id: true,
            name: true
          }
        },
        address: true,
        sizes: {
          include: {
            size: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    })
  ])

  return paginate(items, total)
}
