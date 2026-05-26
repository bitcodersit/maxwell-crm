import type { H3Event } from 'h3'
import z from 'zod'
import { upsertAddress } from '../address'
import { getOrCreateCustomerRole } from '../customerRole'
import { selectCustomer } from './select'

export type TZUpsertCustomers = z.infer<ReturnType<typeof zUpsertCustomers>>
export const zUpsertCustomers = (options?: { except?: number }) => {
  return z.object({
    id: z.number().nullish(),
    name: zName(),
    phone: zPhone({ unique: true, except: options?.except }),
    email: zEmail({ unique: true, except: options?.except }).nullish(),
    company: zString().nullish(),
    designation: zString().nullish(),
    addressLine1: zString().nullish()
  })
}

export const upsertCustomers = async (event: H3Event, options?: { input?: TZUpsertCustomers }) => {
  //
  const input = await getInput(event, v => zUpsertCustomers({ except: v.id }), options)
  const currentUser = await getCurrentUser(event)
  const customerRole = await getOrCreateCustomerRole(prisma as any)

  if (input.id) {
    if (!currentUser.updateAnyUsers) {
      throw err.denied()
    }

    const existing = await prisma.user.findFirst({
      where: {
        id: input.id,
        deletedAt: null,
        userRoles: {
          some: {
            roleId: customerRole.id
          }
        }
      },
      select: {
        id: true,
        addressableId: true,
        addressable: {
          select: {
            addresses: {
              where: {
                deletedAt: null
              },
              orderBy: {
                id: 'asc'
              },
              select: {
                id: true
              }
            }
          }
        }
      }
    })
    if (!existing) throw err.notFound()

    await prisma.user.update({
      where: {
        id: input.id
      },
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        organization: input.company,
        designation: input.designation
      },
      ...selectCustomer({ user: currentUser })
    })

    if (input.addressLine1 !== undefined) {
      const existingAddress = existing.addressable?.addresses?.[0]
      const addressableId =
        existing.addressableId ||
        (
          await prisma.addressable.create({
            data: {}
          })
        ).id

      if (!existing.addressableId) {
        await prisma.user.update({
          where: {
            id: existing.id
          },
          data: {
            addressableId
          }
        })
      }

      await upsertAddress({
        id: existingAddress?.id,
        addressLine1: input.addressLine1 ?? '',
        road: '',
        block: '',
        addressableId
      })
    }

    return prisma.user.findUniqueOrThrow({
      where: {
        id: input.id
      },
      ...selectCustomer({ user: currentUser })
    })
  }

  if (!currentUser.createAnyUsers) {
    throw err.denied()
  }

  const addressableId = input.addressLine1
    ? (
        await prisma.addressable.create({
          data: {}
        })
      ).id
    : undefined

  const customer = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone,
      organization: input.company,
      designation: input.designation,
      addressable: addressableId
        ? {
            connect: {
              id: addressableId
            }
          }
        : undefined,
      creator: {
        connect: {
          id: currentUser.id
        }
      },
      userRoles: {
        create: {
          roleId: customerRole.id
        }
      }
    },
    ...selectCustomer({ user: currentUser })
  })

  if (input.addressLine1 && addressableId) {
    await upsertAddress({
      addressLine1: input.addressLine1,
      road: '',
      block: '',
      addressableId
    })
  }

  return prisma.user.findUniqueOrThrow({
    where: {
      id: customer.id
    },
    ...selectCustomer({ user: currentUser })
  })
}
