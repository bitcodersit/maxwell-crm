import type { H3Event } from 'h3'

type TRecord = Record<string, unknown>
type ExportFormat = 'csv' | 'xlsx'
type ExportColumnValue<T extends TRecord> = ((row: T) => string) | true
type ExportDataOptions<T extends TRecord> = {
  format?: unknown
  filename?: string
  columns?: Record<string, ExportColumnValue<T>>
}

const serializeCell = (value: unknown) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value) || typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

const getFormat = (format: unknown): ExportFormat => {
  return format?.toString().trim() === 'csv' ? 'csv' : 'xlsx'
}

export const exportData = <T extends TRecord>(
  event: H3Event,
  rows: T[],
  options: ExportDataOptions<T> = {}
) => {
  const format = getFormat(options.format)
  const isCsv = format === 'csv'
  const delimiter = isCsv ? ',' : '\t'
  const filename = options.filename ?? `export-${new Date().toISOString().slice(0, 10)}`
  const extension = isCsv ? 'csv' : 'xls'

  const columns = options.columns
  const keys = columns
    ? Object.keys(columns)
    : (Array.from(new Set(rows.flatMap(row => Object.keys(row)))) as string[])

  const escapeCell = (value: unknown) => {
    const text = serializeCell(value).replace(/\r?\n/g, ' ')
    if (!isCsv) return text
    const escaped = text.replace(/"/g, '""')
    return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped
  }

  const resolveCell = (row: T, key: string) => {
    if (!columns) return row[key]
    const resolver = columns[key]
    if (resolver === true) return row[key]
    return resolver?.(row)
  }

  const content = [
    keys.map(key => escapeCell(key)).join(delimiter),
    ...rows.map(row => keys.map(key => escapeCell(resolveCell(row, key))).join(delimiter))
  ].join('\n')

  setHeader(
    event,
    'Content-Type',
    isCsv ? 'text/csv; charset=utf-8' : 'application/vnd.ms-excel; charset=utf-8'
  )
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}.${extension}"`)

  return `\uFEFF${content}`
}
