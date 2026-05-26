import type { TZUpdateProperty } from './zod'
import type { Prisma } from '~~/prisma/client/client'
import { upsertAddress } from '../address/upsertAddress'

export const updateProperty = async (id: number, input: TZUpdateProperty) => {
  const sizeOptions = await prisma.option.findMany({
    where: {
      type: 'SIZE',
      name: {
        in: ['Katha', 'Sqft']
      }
    },
    select: {
      id: true,
      name: true
    }
  })
  const kathaOptionId = sizeOptions.find(item => item.name === 'Katha')?.id
  const sqftOptionId = sizeOptions.find(item => item.name === 'Sqft')?.id

  const existing = await prisma.property.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: {
      sizes: {
        include: {
          size: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })
  if (!existing) throw err.notFound()

  const data: Prisma.PropertyUpdateInput = {}

  if (input.name !== undefined) data.name = input.name
  if (input.facing !== undefined) data.facing = input.facing
  if (input.status !== undefined) data.status = input.status
  if (input.price !== undefined) data.price = input.price
  if (input.previousPrice !== undefined) data.previousPrice = input.previousPrice
  if (input.purchaseTypeId !== undefined) {
    data.purchaseType = input.purchaseTypeId
      ? {
          connect: {
            id: input.purchaseTypeId
          }
        }
      : {
          disconnect: true
        }
  }
  if (input.addressId !== undefined) {
    data.address = input.addressId
      ? {
          connect: {
            id: input.addressId
          }
        }
      : {
          disconnect: true
        }
  }

  if (input.address) {
    const address = (await upsertAddress(input.address)) as { id: number }
    data.address = {
      connect: {
        id: address.id
      }
    }
  }

  if ((input.katha !== undefined || input.sqft !== undefined) && kathaOptionId && sqftOptionId) {
    const existingKatha = existing.sizes.find(item => item.size?.name === 'Katha')?.sizeValue ?? 0
    const existingSqft = existing.sizes.find(item => item.size?.name === 'Sqft')?.sizeValue ?? 0

    data.sizes = {
      deleteMany: {
        sizeId: {
          in: [kathaOptionId, sqftOptionId]
        }
      },
      create: [
        {
          sizeId: kathaOptionId,
          sizeValue: input.katha !== undefined ? input.katha : Number(existingKatha)
        },
        {
          sizeId: sqftOptionId,
          sizeValue: input.sqft !== undefined ? input.sqft : Number(existingSqft)
        }
      ]
    }
  }

  const include = {
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
  } as const

  if (!Object.keys(data).length) {
    return prisma.property.findFirstOrThrow({
      where: { id, deletedAt: null },
      include
    })
  }

  return prisma.property.update({
    where: { id },
    data,
    include
  })
}
