import { z } from 'zod'

export type TZCreateCustomer = z.infer<typeof zCreateCustomer>
export const zCreateCustomer = z.object({
  name: zName(),
  email: zEmail({ unique: true }).nullish(),
  phone: zPhone({ unique: true })
})

export const createCustomer = async (data: TZCreateCustomer) => {
  const where: Prisma.UserWhereInput = {}

  if (data.email) where.email = data.email
  if (data.phone) where.phone = data.phone

  const existing = await prisma.user.findFirst({
    where: {
      phone: data.phone
    }
  })

  if (existing) return existing
  return prisma.user.create({ data })
}
