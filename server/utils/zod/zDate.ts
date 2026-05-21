import { endOfDay, startOfDay } from 'date-fns'
import { z } from 'zod'

export type TZDate = z.infer<ReturnType<typeof zDate>>
export const zDate = (message = 'Invalid date') => {
  return z.coerce.date(message)
}

export type TZDateRequired = z.infer<ReturnType<typeof zDateRequired>>
export const zDateRequired = (message = 'Date is required!') => {
  return z.preprocess(
    (v: unknown) => (v === null || v === undefined || v === '' ? undefined : v.toString()),
    zDate(message)
  )
}

export type TZDateSingleObject = z.infer<ReturnType<typeof zDateSingleObject>>
export const zDateSingleObject = () => {
  return z
    .object({
      mode: z.enum(['lt', 'lte', 'eq', 'gte', 'gt']),
      value: zDateRequired().nullish()
    })
    .transform(({ mode, value }) => {
      if (!value) return undefined
      const dayStart = startOfDay(value)
      const dayEnd = endOfDay(value)
      if (mode === 'lt') return { lt: dayStart }
      if (mode === 'lte') return { lte: dayEnd }
      if (mode === 'gt') return { gt: dayEnd }
      if (mode === 'gte') return { gte: dayStart }
      return { gte: dayStart, lte: dayEnd }
    })
}

export type TZDateRangeObject = z.infer<ReturnType<typeof zDateRangeObject>>
export const zDateRangeObject = () => {
  return z
    .object({
      mode: z.literal('range'),
      value: z
        .union([
          z.object({ start: zDateRequired(), end: zDateRequired() }),
          z.object({ start: zDateRequired() }),
          z.object({ end: zDateRequired() })
        ])
        .nullish()
    })
    .transform(({ value }) => {
      if (!value) return undefined
      return {
        gte: 'start' in value ? startOfDay(value.start) : undefined,
        lte: 'end' in value ? endOfDay(value.end) : undefined
      }
    })
}

export type TZDateMultipleObject = z.infer<ReturnType<typeof zDateMultipleObject>>
export const zDateMultipleObject = () => {
  return z
    .object({
      mode: z.literal('multiple'),
      value: z.array(zDateRequired()).nullish()
    })
    .transform(v => {
      if (!v.value) return undefined
      return v.value.map(date => ({
        gte: startOfDay(date),
        lte: endOfDay(date)
      }))
    })
}

export type TZDateObject = z.infer<ReturnType<typeof zDateObject>>
export const zDateObject = () => {
  return z.preprocess(
    value => {
      if (isPlainObject(value)) return value
      if (typeof value === 'string') {
        const [parsed] = jsonParse(value.trim())
        if (isPlainObject(parsed)) {
          return parsed
        }
      }
      return {}
    },
    z.union([zDateSingleObject(), zDateRangeObject(), zDateMultipleObject()])
  )
}
