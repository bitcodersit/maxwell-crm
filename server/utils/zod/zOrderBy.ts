import { z } from 'zod'

type TOrderBy<T extends string = string> = Record<T, 'asc' | 'desc'> | TOrderBy<T>[]
const Default: TOrderBy = { id: 'desc' }

export type TZOrderByObject = z.infer<ReturnType<typeof zOrderByObject>>
export const zOrderByObject = () => {
  return z.record(z.string(), z.enum(['asc', 'desc'])).transform<TOrderBy | undefined>(v => {
    const entries = Object.entries(v)
    if (!entries.length) return undefined
    if (entries.length === 1) return v
    return entries.map(([key, value]) => ({ [key]: value }))
  })
}

export type TZOrderByString = z.infer<ReturnType<typeof zOrderByString>>
export const zOrderByString = () => {
  return z.preprocess(value => {
    if (isPlainObject(value)) return value
    if (typeof value !== 'string') return {}
    try {
      const parsed = JSON.parse(value)
      return isPlainObject(parsed) ? parsed : {}
    } catch {
      return {}
    }
  }, zOrderByObject())
}

export type TZOrderBy = z.infer<ReturnType<typeof zOrderBy>>
export const zOrderBy = (_default: TOrderBy = Default) => {
  return z.union([zOrderByString(), zOrderByObject()]).default(_default)
}

export type TZOrderable = z.infer<ReturnType<typeof zOrderable>>
export const zOrderable = (_default: TOrderBy = Default) => {
  return z.object({ orderBy: zOrderBy(_default) })
}

export type TZOrderByRecord = z.infer<ReturnType<typeof zOrderByRecord>>
export const zOrderByRecord = <T extends string[]>(fields: Readonly<T>) => {
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
      .transform<Record<T[number], Prisma.SortOrder>[] | undefined>(v => {
        const entries = Object.entries(v)
        if (!entries.length) return undefined
        return entries.map(([key, value]) => ({ [key]: value })) as any
      })
  )
}
