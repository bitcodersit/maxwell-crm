import type { H3Event } from 'h3'
import type { ZodError } from 'zod'
import { createRequire } from 'node:module'
import { upsertCustomers, zUpsertCustomers } from './upsertCustomers'

// xlsx is CJS; createRequire avoids Windows ESM "w:" path protocol errors under Nitro
const require = createRequire(import.meta.url)
const XLSX = require('xlsx') as typeof import('xlsx')

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

const HEADER_ALIASES: Record<string, keyof Omit<TCustomerImportFailedRow, 'row' | 'errors'>> = {
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

const EXAMPLE_HEADERS = ['name', 'phone', 'email', 'company', 'designation', 'addressLine1'] as const

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

const normalizeHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

const cellToString = (value: unknown) => {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return String(value).trim()
}

const isEmptyRow = (row: Record<string, string>) =>
  !Object.values(row).some(value => value.length > 0)

const formatZodErrors = (error: ZodError) => {
  const issues = error.issues ?? []
  if (!issues.length) return ['Invalid row']
  return issues.map(issue => {
    const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })
}

const mapSheetRows = (sheet: XLSX.WorkSheet) => {
  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false
  })

  if (!matrix.length) return [] as Record<string, string>[]

  const headers = (matrix[0] ?? []).map(normalizeHeader)
  const mappedHeaders = headers.map(header => HEADER_ALIASES[header])

  if (!mappedHeaders.includes('name') || !mappedHeaders.includes('phone')) {
    throw createError({
      statusCode: 422,
      message: 'Import file must include name and phone columns'
    })
  }

  return matrix.slice(1).map(cells => {
    const row: Record<string, string> = {
      name: '',
      phone: '',
      email: '',
      company: '',
      designation: '',
      addressLine1: ''
    }

    mappedHeaders.forEach((field, index) => {
      if (!field) return
      row[field] = cellToString(cells[index])
    })

    return row
  })
}

export const parseCustomerImportFile = async (file: File) => {
  const name = file.name?.toLowerCase() ?? ''
  const allowed =
    name.endsWith('.csv') ||
    name.endsWith('.xlsx') ||
    name.endsWith('.xls') ||
    file.type.includes('csv') ||
    file.type.includes('sheet') ||
    file.type.includes('excel')

  if (!allowed) {
    throw createError({
      statusCode: 422,
      message: 'Only CSV or Excel (.xlsx, .xls) files are supported'
    })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false })
  const firstSheetName = workbook.SheetNames[0]
  if (!firstSheetName) {
    throw createError({
      statusCode: 422,
      message: 'The uploaded file has no worksheets'
    })
  }

  const sheet = workbook.Sheets[firstSheetName]
  if (!sheet) {
    throw createError({
      statusCode: 422,
      message: 'Unable to read the first worksheet'
    })
  }

  return mapSheetRows(sheet)
}

export const importCustomers = async (event: H3Event): Promise<TCustomerImportResult> => {
  const currentUser = await getCurrentUser(event)
  if (!currentUser.createAnyUsers) {
    throw err.denied()
  }

  const fd = await readFormData(event)
  const file = fd.get('file')

  if (!(file instanceof File)) {
    throw createError({
      statusCode: 422,
      message: 'Please upload a CSV or Excel file'
    })
  }

  const rows = await parseCustomerImportFile(file)
  const failed: TCustomerImportFailedRow[] = []
  let imported = 0
  let total = 0

  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index]!
    if (isEmptyRow(raw)) continue

    total += 1
    const rowNumber = index + 2 // header is row 1
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
  const format = String(getQuery(event).format ?? 'xlsx').toLowerCase()
  const filename = 'customers-import-example'

  if (format === 'csv') {
    return exportData(event, EXAMPLE_ROWS, {
      format: 'csv',
      filename,
      columns: Object.fromEntries(EXAMPLE_HEADERS.map(key => [key, true])) as Record<string, true>
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(EXAMPLE_ROWS, { header: [...EXAMPLE_HEADERS] })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  setHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.xlsx"`)
  return buffer
}
