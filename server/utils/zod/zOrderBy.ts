import { z } from 'zod'

export type TOrderBy<T extends string[]> = Record<T[number], Prisma.SortOrder>[]
const DefaultOrderBy: TOrderBy<string[]> = [{ id: 'desc' }]

export type TZOrderByRecord = z.infer<ReturnType<typeof zOrderByRecord>>
export const zOrderByRecord = <T extends string[]>(
  fields: Readonly<T>,
  defaultOrderBy: TOrderBy<T> = DefaultOrderBy
) => {
  return z.preprocess(
    value => {
      if (isPlainObject(value)) return value
      if (typeof value !== 'string') return {}
      try {
        const parsed = JSON.parse(value)
        return isPlainObject(parsed) ? parsed : {}
      } catch {
        return {}
      }
    },
    z
      .partialRecord(z.enum(fields), z.enum<Prisma.SortOrder[]>(['asc', 'desc']))
      .transform<Record<T[number], Prisma.SortOrder>[]>(v => {
        const entries = Object.entries(v)
        if (!entries.length) return defaultOrderBy
        return entries.map(([key, value]) => ({ [key]: value })) as any
      })
  )
}
