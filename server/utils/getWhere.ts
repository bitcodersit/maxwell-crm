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
      .filter(v => !isNaN(v))
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
      lte
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
    textMode: (query[key + 'Mode'] || 'contains').toString().trim() as string
  }
}

const getDate = (query: any, key: string) => {
  const date = query[key]

  // array of dates
  if (Array.isArray(date)) {
    if (!date.length) return
    return date.map(date => ({
      gte: startOfDay(new Date(date)),
      lte: endOfDay(new Date(date))
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
      lte: endOfDay(new Date(end))
    }
  }

  // single date
  return {
    gte: startOfDay(new Date(dateStr)),
    lte: endOfDay(new Date(dateStr))
  }
}

const getBool = (query: any, key: string): boolean | undefined => {
  const value = query[key]
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'boolean') return value
  if (isTrue(value)) return true
  if (isFalse(value)) return false
  return undefined
}

export const getWhere = <T>(query: Record<string, any>, where: T = {} as T) => {
  return {
    id(key: string, updater: string | ((id: TId) => Partial<T>) = key) {
      const id = getId(query, key)
      if (id) {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(id) }
        } else {
          where = { ...where, [key]: id }
        }
      }
      return this
    },
    text(key: string, updater: string | ((text: string, mode: string) => Partial<T>) = key) {
      const { text, textMode } = getText(query, key)
      if (text) {
        if (typeof updater === 'function') {
          where = {
            ...where,
            ...updater(text, textMode)
          }
        } else {
          where = {
            ...where,
            [updater]: textMode === 'contains' ? { contains: text } : text
          }
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
          where = { ...where, OR: date.map(d => ({ [key]: d })) }
        } else {
          where = { ...where, [key]: date }
        }
      }
      return this
    },
    bool(key: string, updater: string | ((value: boolean) => Partial<T>) = key) {
      const value = getBool(query, key)
      if (typeof value === 'boolean') {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(value) }
        } else {
          where = { ...where, [updater]: value }
        }
      }
      return this
    },
    true(key: string, updater: string | (() => Partial<T>) = key) {
      return this.bool(key, value => {
        if (!value) return {}
        if (typeof updater === 'function') {
          return updater()
        }
        return { [updater]: true } as Partial<T>
      })
    },
    false(key: string, updater: string | (() => Partial<T>) = key) {
      return this.bool(key, value => {
        if (value) return {}
        if (typeof updater === 'function') {
          return updater()
        }
        return { [updater]: false } as Partial<T>
      })
    },
    array(key: string, updater: string | ((value: any[]) => Partial<T>) = key) {
      const value = query[key]
      const values = Array.isArray(value)
        ? value
        : (value || '').toString().trim().split(',').filter(Boolean)
      if (values.length) {
        if (typeof updater === 'function') {
          where = { ...where, ...updater(values) }
        } else {
          where = { ...where, [updater]: { in: values } }
        }
      }
      return this
    },
    get(): T {
      return where
    }
  }
}
