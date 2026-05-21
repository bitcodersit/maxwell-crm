import { z } from 'zod'
import { isPlainObject } from './isPlainObject'

type TOrderBy = Record<string, 'asc' | 'desc'> | TOrderBy[]
const Default: TOrderBy = { id: 'desc' }

export type TZOrderByObject = z.infer<typeof zOrderByObject>
export const zOrderByObject = () => {
  return z.record(z.string(), z.enum(['asc', 'desc'])).transform<TOrderBy | undefined>(v => {
    const entries = Object.entries(v)
    if (!entries.length) return undefined
    if (entries.length === 1) return v
    return entries.map(([key, value]) => ({ [key]: value }))
  })
}

export type TZOrderByString = z.infer<typeof zOrderByString>
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

export type TZOrderBy = z.infer<typeof zOrderBy>
export const zOrderBy = (_default: TOrderBy = Default) => {
  return z.union([zOrderByString(), zOrderByObject()]).default(_default)
}

export type TZOrderable = z.infer<typeof zOrderable>
export const zOrderable = (_default: TOrderBy = Default) => {
  return z.object({ orderBy: zOrderBy(_default) })
}
