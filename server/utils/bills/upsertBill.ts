import type { H3Event } from 'h3'
import z from 'zod'

export type TZCreateBill = z.infer<typeof zCreateBill>
export const zCreateBill = z.object({
  userId: zId(),
  typeId: zId(),
  date: zDate(),
  amount: z.coerce.number().nonnegative(),
  purpose: zString().nullish()
})

export type TZUpdateBill = z.infer<typeof zUpdateBill>
export const zUpdateBill = z.object({
  id: zId(),
  userId: zId().nullish(),
  typeId: zId().nullish(),
  date: zDate().nullish(),
  amount: z.coerce.number().nonnegative().nullish(),
  purpose: zString().nullish()
})

export type TZUpsertBill = z.infer<typeof zUpsertBill>
export const zUpsertBill = z.union([zUpdateBill, zCreateBill])

export const upsertBill = async (event: H3Event, options?: { input?: TZUpsertBill }) => {
  const user = await getCurrentUser(event)
  const input = options?.input ?? (await validate(await readBody(event), zUpsertBill))

  if ('id' in input) {
    const bill = await prisma.bill.findUnique({
      where: {
        id: input.id
      },
      select: {
        id: true,
        userId: true,
        typeId: true,
        date: true,
        amount: true,
        status: true,
        purpose: true,
        authorId: true
      }
    })
    if (!bill) throw err.notFound()

    const isAdmin = !!user.updateAnyBills
    const canAuthorEdit =
      bill.authorId === user.id && ['New', 'Cancelled', 'Rejected'].includes(bill.status)
    if (!isAdmin && !canAuthorEdit) {
      throw err.denied()
    }

    const data: Prisma.BillUpdateInput = {}

    if (input.userId && input.userId !== bill.userId) {
      data.user = getConnect(input.userId)
    }
    if (input.typeId && input.typeId !== bill.typeId) {
      data.type = getConnect(input.typeId)
    }
    if (input.date && input.date.getTime() !== bill.date.getTime()) {
      data.date = input.date
    }

    if (input.amount != null && Number(input.amount) !== Number(bill.amount)) {
      data.amount = input.amount
    }

    if (input.purpose !== undefined && input.purpose !== bill.purpose) {
      data.purpose = input.purpose
    }

    if (Object.keys(data).length) {
      await prisma.bill.update({
        where: {
          id: input.id
        },
        data
      })
    }

    return {
      message: 'Bill updated successfully'
    }
  }

  await prisma.bill.create({
    data: {
      user: getConnect(input.userId),
      type: getConnect(input.typeId),
      author: getConnect(user.id),
      date: input.date,
      amount: input.amount,
      purpose: input.purpose
    }
  })

  return {
    message: 'Bill created successfully'
  }
}
