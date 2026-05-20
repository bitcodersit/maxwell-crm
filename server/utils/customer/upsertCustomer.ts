import type { TZUpsertCustomer } from './zod'

export const upsertCustomer = async (input: TZUpsertCustomer) => {
  const data = input as Prisma.AtLeast<TZUpsertCustomer, 'name' | 'email' | 'phone'>
  const where: Prisma.UserWhereInput = { OR: [] }
  if (where.OR) {
    if (data.id) where.OR.push({ id: data.id })
    if (data.phone) where.OR.push({ phone: data.phone })
    if (data.email) where.OR.push({ email: data.email })
  }
  const user = await prisma.user.findFirst({ where })
  if (user) {
    const update: Prisma.UserUpdateInput = {}
    if (data.name) update.name = data.name
    if (data.email) update.email = data.email
    if (data.phone) update.phone = data.phone
    return prisma.user.update({
      where: { id: user.id },
      data: update
    })
  }
  return prisma.user.create({
    data: {
      name: data.name ?? '',
      email: data.email,
      phone: data.phone
    }
  })
}
