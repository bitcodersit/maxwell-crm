import type { H3Event } from 'h3'
import type z from 'zod'

export type TZExportCustomers = z.infer<typeof zExportCustomers>
export const zExportCustomers = zGetCustomers.and(zExportable())

export const exportCustomers = async (
  event: H3Event,
  options?: {
    input?: TZExportCustomers
  }
) => {
  const user = await getCurrentUser(event)
  if (!user.exportAnyUsers) {
    throw err.denied()
  }

  const input = options?.input ?? (await validate(getQuery(event), zExportCustomers))

  let customersInput: TZGetCustomers = input

  if (input.selection === 'selected') {
    if (!input.id || ('in' in input.id && !input.id.in.length)) {
      return createError({
        statusCode: 400,
        message: 'No IDs provided'
      })
    }
    customersInput = {
      id: input.id,
      options: false,
      paginate: false,
      orderBy: input.orderBy
    }
  } else if (input.selection === 'current-page') {
    customersInput = {
      ...customersInput,
      options: false,
      paginate: true
    }
  } else if (input.selection === 'all') {
    customersInput = {
      ...customersInput,
      options: false,
      paginate: false
    }
  }

  const data = await getCustomers(event, {
    input: customersInput
  })

  const rows = (Array.isArray(data) ? data : data.data) as TUser[]
  return exportData(event, rows, {
    format: input.format,
    filename: `Customers ${new Date().toISOString().slice(0, 10)} - ${Date.now()}`,
    columns: {
      id: true,
      name: true,
      phone: true,
      email: true,
      company: v => v.organization || '',
      designation: true,
      address: v =>
        ((v as any)?.addressable?.addresses?.[0]?.addressLine1 as string | undefined) || '',
      creator: v => v.creator?.name || '',
      createdAt: v => new Date(v.createdAt as Date).toISOString(),
      updatedAt: v => new Date(v.updatedAt as Date).toISOString()
    }
  })
}
