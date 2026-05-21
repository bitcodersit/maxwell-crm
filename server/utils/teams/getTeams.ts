import z from 'zod'
import { getWhere2 } from '../getWhere'
import { selectTeam } from './select'
import { getTeamScopedWhere } from './where'

export type TGetTeams = z.infer<typeof zGetTeams>
export const zGetTeams = z
  .object({
    id: zIds(),
    creatorId: zIds(),
    memberUserIds: zIds(),
    q: z.string().trim().nullish(),
    createdAt: zDateObject().nullish(),
    updatedAt: zDateObject().nullish(),
    options: zBoolean().default(false)
  })
  .and(zPagination())
  .and(zOrderable())

export const getTeams = async (input: TGetTeams, user: TUser) => {
  const orderBy = input.orderBy as Prisma.TeamFindManyArgs['orderBy']
  const where = getTeamScopedWhere(
    user,
    getWhere2<Prisma.TeamWhereInput, TGetTeams>(input, {
      deletedAt: null
    })
      .id('id')
      .id('creatorId')
      .text('q', ['name', 'description'])
      .id('memberUserIds', userId => ({
        members: {
          some: {
            userId
          }
        }
      }))
      .date('createdAt')
      .get()
  )

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
