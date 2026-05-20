import type { TZCreateProperty } from './zod'
import type { TUser } from '~~/shared/types/User'
import { upsertAddress } from '../address/upsertAddress'

const generatePropertySid = async () => {
  const last = await prisma.property.findFirst({
    orderBy: {
      id: 'desc'
    },
    select: {
      sid: true
    }
  })
  let sid = 1
  if (last?.sid) {
    const lastNumber = Number(last.sid.split('-')[1])
    if (Number.isFinite(lastNumber)) {
      sid = lastNumber + 1
    }
  }
  return `PROP-${sid.toString().padStart(5, '0')}`
}

export const createProperty = async (input: TZCreateProperty, user?: TUser) => {
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
  if (!kathaOptionId || !sqftOptionId) {
    throw err.unprocessable({
      size: {
        errors: ['Size options "Katha" and "Sqft" are required']
      }
    })
  }

  let addressId = input.addressId ?? undefined
  if (!addressId && input.address) {
    addressId = (await upsertAddress(input.address)).id
  }

  return prisma.property.create({
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
    },
    data: {
      sid: await generatePropertySid(),
      name: input.name,
      status: input.status,
      creatorId: user?.id,
      purchaseTypeId: input.purchaseTypeId ?? undefined,
      addressId,
      facing: input.facing,
      price: input.price,
      previousPrice: input.previousPrice,
      sizes: {
        create: [
          {
            sizeId: kathaOptionId,
            sizeValue: input.katha
          },
          {
            sizeId: sqftOptionId,
            sizeValue: input.sqft
          }
        ]
      }
    }
  })
}
