import type { TZUpdateProperty } from './zod'
import type { Prisma } from '~~/prisma/client/client'
import type { TUser } from '~~/shared/types/User'
import { upsertAddress } from '../address/upsertAddress'
import { getAssignableCreate, getAssignableUpdate } from '../assignable'
import { getAssignableUserIds } from '../notifications'
import { notifyPropertyAssigned } from './notifyPropertyAssignees'
import { selectPropertyForDisplay } from './select'

export const updateProperty = async (id: number, input: TZUpdateProperty, user: TUser) => {
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

  const shouldNotifyAssignment = Array.isArray(input.userIds)

  if (input.userIds) {
    data.assignable = existing.assignableId
      ? getAssignableUpdate({ userIds: input.userIds }, user)
      : getAssignableCreate({ userIds: input.userIds }, user)
  } else if (input.userIds === null) {
    if (existing.assignableId) {
      data.assignable = {
        update: {
          users: {
            deleteMany: {}
          }
        }
      }
    }
  }

  if (!Object.keys(data).length) {
    return prisma.property.findFirstOrThrow({
      where: { id, deletedAt: null },
      include: selectPropertyForDisplay
    })
  }

  const previousUserIds =
    shouldNotifyAssignment && existing.assignableId
      ? await getAssignableUserIds(existing.assignableId)
      : []

  const property = await prisma.property.update({
    where: { id },
    data,
    include: selectPropertyForDisplay
  })

  if (shouldNotifyAssignment) {
    try {
      await notifyPropertyAssigned(property, user, { previousUserIds })
    } catch (error) {
      console.error('Failed to notify property assigned', error)
    }
  }

  return property
}
