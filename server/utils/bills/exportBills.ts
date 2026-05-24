import type { H3Event } from 'h3'
import type z from 'zod'

export type TZExportBills = z.infer<typeof zExportBills>
export const zExportBills = zGetBills.and(zExportable())

export const exportBills = async (event: H3Event, options?: { input?: TZExportBills }) => {
  const user = await getCurrentUser(event)
  if (!user.exportAnyBills) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zExportBills))

  let billsInput: TZGetBills = input

  if (input.selection === 'selected') {
    if (!input.id || ('in' in input.id && !input.id.in.length)) {
      return createError({
        statusCode: 400,
        message: 'No IDs provided'
      })
    }
    billsInput = {
      id: input.id,
      paginate: false,
      options: false,
      orderBy: input.orderBy
    }
  } else if (input.selection === 'current-page') {
    billsInput = {
      ...billsInput,
      options: false,
      paginate: true
    }
  } else if (input.selection === 'all') {
    billsInput = {
      ...billsInput,
      options: false,
      paginate: false
    }
  }

  const data = await getBills(event, {
    input: billsInput
  })

  const rows = (Array.isArray(data) ? data : data.data) as TBill[]
  return exportData(event, rows, {
    format: input.format,
    filename: `Conveyance Bills ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      date: v => new Date(v.date as Date).toISOString().slice(0, 10),
      amount: v => Number(v.amount || 0).toFixed(2),
      status: true,
      purpose: true,
      type: v => v.type?.name || '',
      user: v => v.user?.name || '',
      reviewer: v => v.reviewer?.name || '',
      author: v => v.author?.name || '',
      createdAt: v => new Date(v.createdAt as Date).toISOString(),
      updatedAt: v => new Date(v.updatedAt as Date).toISOString()
    }
  })
}
