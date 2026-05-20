import type { Address } from '~~/prisma/client/client'
import type { TZUpsertAddress } from './zod'

export const upsertAddress = async (data: TZUpsertAddress): Promise<Address> => {
  return prisma.address.upsert({
    where: data.id
      ? { id: data.id }
      : {
          addressLine1_road_block: {
            addressLine1: data.addressLine1,
            road: data.road,
            block: data.block
          }
        },
    update: {
      name: data.name,
      addressLine1: data.addressLine1,
      road: data.road,
      block: data.block
    },
    create: {
      name: data.name,
      addressLine1: data.addressLine1,
      road: data.road,
      block: data.block
    }
  })
}
