import type { H3Event } from 'h3'
import z from 'zod'

export type TZGetTeams = z.infer<typeof zGetTeams>
export const zGetTeams = z
  .object({
    q: z.string().trim().nullish(),
    id: zIds(),
    creatorId: zIds(),
    memberUserIds: zIds(),
    createdAt: zDateObject().nullish(),
    updatedAt: zDateObject().nullish(),
    options: zBoolean().default(false),
    orderBy: zOrderByRecord(['id', 'name', 'description', 'createdAt', 'updatedAt', 'creatorId'])
  })
  .and(zPagination())

export const getTeams = async (
  event: H3Event,
  options?: {
    input?: TZGetTeams
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.readAnyTeams && !user.readOwnTeams) {
    return err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetTeams))
  const orderBy = getOrderBy2(input.orderBy, {
    creatorId(order) {
      return {
        creator: {
          name: order
        }
      }
    }
  })

  const where = getWhere2<Prisma.TeamWhereInput, TZGetTeams>(input)
    .id('id')
    .id('creatorId')
    .id('memberUserIds', userId => ({
      members: {
        some: {
          userId
        }
      }
    }))
    .text('q', ['name', 'description'])
    .date('createdAt')
    .date('updatedAt')
    .extend({ deletedAt: null })
    .scope(v => getScopedTeam(v, user))
    .get()

  const { take, skip, paginate } = getPagination(input)
  const [total, teams] = await prisma.$transaction([
    prisma.team.count({ where }),
    prisma.team.findMany({
      skip,
      take,
      where,
      orderBy,
      ...selectTeam(input)
    })
  ])

  return paginate(teams, total)
}
