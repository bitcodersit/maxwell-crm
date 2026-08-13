import type { H3Event } from 'h3'
import { upsertCustomers, zUpsertCustomers } from './upsertCustomers'

export type TCustomerImportFailedRow = {
  row: number
  name?: string
  phone?: string
  email?: string
  company?: string
  designation?: string
  addressLine1?: string
  errors: string[]
}

export type TCustomerImportResult = {
  imported: number
  failed: TCustomerImportFailedRow[]
  total: number
}

const FIELDS = ['name', 'phone', 'email', 'company', 'designation', 'addressLine1'] as const

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  phone: 'phone',
  email: 'email',
  company: 'company',
  organization: 'company',
  designation: 'designation',
  address: 'addressLine1',
  addressline1: 'addressLine1',
  'address line 1': 'addressLine1',
  address_line_1: 'addressLine1'
}

const EXAMPLE_ROWS = [
  {
    name: 'John Doe',
    phone: '01712345678',
    email: 'john@example.com',
    company: 'Acme Ltd',
    designation: 'Manager',
    addressLine1: 'House 12, Road 5, Dhanmondi'
  },
  {
    name: 'Jane Smith',
    phone: '01812345678',
    email: '',
    company: 'Beta Co',
    designation: 'Director',
    addressLine1: 'Apartment 3B, Gulshan 2'
  }
]

export const importCustomers = async (event: H3Event): Promise<TCustomerImportResult> => {
  const currentUser = await getCurrentUser(event)
  if (!currentUser.createAnyUsers) {
    throw err.denied()
  }

  const file = await readImportFile(event)
  const rows = await parseSpreadsheetFile(file, {
    aliases: HEADER_ALIASES,
    fields: [...FIELDS],
    requiredFields: ['name', 'phone'],
    requiredMessage: 'Import file must include name and phone columns'
  })

  const failed: TCustomerImportFailedRow[] = []
  let imported = 0
  let total = 0

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index]!
    if (isEmptyRow(raw)) continue

    total += 1
    const rowNumber = index + 2
    const payload = {
      name: raw.name,
      phone: raw.phone,
      email: raw.email || null,
      company: raw.company || null,
      designation: raw.designation || null,
      addressLine1: raw.addressLine1 || null
    }

    const parsed = await zUpsertCustomers().safeParseAsync(payload)
    if (!parsed.success) {
      failed.push({
        row: rowNumber,
        name: raw.name || undefined,
        phone: raw.phone || undefined,
        email: raw.email || undefined,
        company: raw.company || undefined,
        designation: raw.designation || undefined,
        addressLine1: raw.addressLine1 || undefined,
        errors: formatZodErrors(parsed.error)
      })
      continue
    }

    try {
      await upsertCustomers(event, { input: parsed.data })
      imported += 1
    } catch (error: any) {
      failed.push({
        row: rowNumber,
        name: raw.name || undefined,
        phone: raw.phone || undefined,
        email: raw.email || undefined,
        company: raw.company || undefined,
        designation: raw.designation || undefined,
        addressLine1: raw.addressLine1 || undefined,
        errors: [error?.message || 'Failed to import this row']
      })
    }
  }

  if (!total) {
    throw createError({
      statusCode: 422,
      message: 'No customer rows found in the uploaded file'
    })
  }

  return { imported, failed, total }
}

export const getCustomerImportExample = (event: H3Event) => {
  return writeImportExample(event, EXAMPLE_ROWS, {
    filename: 'customers-import-example',
    headers: [...FIELDS],
    sheetName: 'Customers'
  })
}
