import type { H3Event } from 'h3'
import z from 'zod'
import { canReadUsers, getScopedUser } from './utils'

export type TZGetUser = z.infer<typeof zGetUser>
export const zGetUser = z.object({
  id: zId().nullish()
})

export const getUser = async (
  event: H3Event,
  options?: {
    input?: TZGetUser
  }
) => {
  const user = await getCurrentUser(event)
  if (!canReadUsers(user)) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zGetUser))
  const where = getWhere2<Prisma.UserWhereInput, TZGetUser>(input)
    .id('id')
    .extend({ deletedAt: null })
    .scope(v => getScopedUser(v, user))
    .get()

  const data = await prisma.user.findFirst({
    where,
    ...selectUser({
      user
    })
  })

  if (!data) throw err.notFound()
  return data
}
