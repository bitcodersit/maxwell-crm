import type { TZAddress } from './zod'

export const createAddress = (data: TZAddress) => {
  return prisma.address.create({ data })
}
