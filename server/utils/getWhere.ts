import { endOfDay, startOfDay } from 'date-fns'

type TIdIn = { in: number[] }
type TIdRange = { lte: number; gte: number }
type TId = TIdIn | TIdRange

type TDateRange = { gte: Date; lte: Date }
type TDate = TDateRange | TDateRange[]

const getId = (query: any, key: string): TId | undefined => {
  const value = query[key]
  if (Array.isArray(value)) {
    const ids = value
      .filter(Boolean)
      .map(Number)
      .filter((v) => !isNaN(v))
    if (!ids.length) return undefined
    return { in: ids }
  }
  const v = (query[key] || '').toString().trim()
  if (v.includes('-')) {
    const [start, end] = v.split('-')
    const gte = Number(start)
    const lte = Number(end)
    if (isNaN(gte) || isNaN(lte)) return undefined
    return {
      gte,
      lte,
    }
  }
  const ids = v
    .split(',')
    .filter((v: string) => v.trim())
    .map(Number)
    .filter((v: number) => !isNaN(v))
  if (!ids.length) return
  return { in: ids }
}

const getText = (query: any, key: string) => {
  return {
    text: (query[key] || '').toString().trim() as string,
    textMode: (query[key + 'Mode'] || 'contains').toString().trim() as string,
  }
}

const getDate = (query: any, key: string) => {
  const date = query[key]

  // array of dates
  if (Array.isArray(date)) {
    if (!date.length) return
    return date.map((date) => ({
      gte: startOfDay(new Date(date)),
      lte: endOfDay(new Date(date)),
    }))
  }

  // string date, single date or range
  const dateStr = date?.toString()?.trim()
  if (!dateStr) return

  // range
  const [start, end] = dateStr.split(',')
  if (start && end) {
    return {
      gte: startOfDay(new Date(start)),
      lte: endOfDay(new Date(end)),
    }
  }

  // single date
  return {
    gte: startOfDay(new Date(dateStr)),
    lte: endOfDay(new Date(dateStr)),
  }
}

export const getWhere = <T extends Record<string, any>>(query: Record<string, any>) => {
  let where: any = {}
  return {
    id(key: string, updater: string | ((id: TId) => Partial<T>) = key) {
      const id = getId(query, key)
      if (id) {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(id) }
        } else {
          where[key] = id
        }
      }
      return this
    },
    text(key: string, updater: string | ((text: string, mode: string) => Partial<T>) = key) {
      const { text, textMode } = getText(query, key)
      if (text) {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(text, textMode) }
        } else {
          where[updater] = textMode === 'contains' ? { contains: text } : text
        }
      }
      return this
    },
    date(key: string, updater?: string | ((date: TDate) => Partial<T>)) {
      const date = getDate(query, key)
      if (date) {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(date) }
        } else if (Array.isArray(date)) {
          where = { ...where, OR: date.map((d) => ({ [key]: d })) }
        } else {
          where = { ...where, [key]: date }
        }
      }
      return this
    },
    get(): T {
      return where
    },
  }
}
