import type { ZodError } from 'zod'
import { createRequire } from 'node:module'
import type { H3Event } from 'h3'

// xlsx is CJS; createRequire avoids Windows ESM "w:" path protocol errors under Nitro
const require = createRequire(import.meta.url)
const XLSX = require('xlsx') as typeof import('xlsx')

export const normalizeHeader = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')

export const cellToString = (value: unknown) => {
  if (value == null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return String(value).trim()
}

export const isEmptyRow = (row: Record<string, string>) =>
  !Object.values(row).some(value => value.length > 0)

export const formatZodErrors = (error: ZodError) => {
  const issues = error.issues ?? []
  if (!issues.length) return ['Invalid row']
  return issues.map(issue => {
    const path = issue.path?.length ? `${issue.path.join('.')}: ` : ''
    return `${path}${issue.message}`
  })
}

export type TSpreadsheetParseOptions = {
  aliases: Record<string, string>
  requiredFields?: string[]
  fields: string[]
  requiredMessage?: string
}

export const parseSpreadsheetFile = async (file: File, options: TSpreadsheetParseOptions) => {
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

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: false
  })

  if (!matrix.length) return [] as Record<string, string>[]

  const headers = (matrix[0] ?? []).map(normalizeHeader)
  const mappedHeaders = headers.map(header => options.aliases[header])

  const required = options.requiredFields ?? []
  const missing = required.filter(field => !mappedHeaders.includes(field))
  if (missing.length) {
    throw createError({
      statusCode: 422,
      message:
        options.requiredMessage ||
        `Import file must include columns: ${required.join(', ')}`
    })
  }

  return matrix.slice(1).map(cells => {
    const row: Record<string, string> = Object.fromEntries(options.fields.map(field => [field, '']))
    mappedHeaders.forEach((field, index) => {
      if (!field) return
      row[field] = cellToString(cells[index])
    })
    return row
  })
}

export const readImportFile = async (event: H3Event) => {
  const fd = await readFormData(event)
  const file = fd.get('file')
  if (!(file instanceof File)) {
    throw createError({
      statusCode: 422,
      message: 'Please upload a CSV or Excel file'
    })
  }
  return file
}

export const writeImportExample = <T extends Record<string, unknown>>(
  event: H3Event,
  rows: T[],
  options: {
    filename: string
    headers: string[]
    sheetName?: string
  }
) => {
  const format = String(getQuery(event).format ?? 'xlsx').toLowerCase()
  const filename = options.filename

  if (format === 'csv') {
    return exportData(event, rows, {
      format: 'csv',
      filename,
      columns: Object.fromEntries(options.headers.map(key => [key, true])) as Record<string, true>
    })
  }

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: options.headers })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1')
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer

  setHeader(
    event,
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  )
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.xlsx"`)
  return buffer
}
