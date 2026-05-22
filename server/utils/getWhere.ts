/* eslint-disable no-unused-vars */
import type { TZDateObject, TZId } from './zod'
import { endOfDay, startOfDay } from 'date-fns'

type TIdIn = { in: number[] }
type TIdRange = { lte: number; gte: number }
type TId = TIdIn | TIdRange

type TDateRange = { gte: Date; lte: Date }
type TDateOpen = { gte: Date } | { lte: Date } | { lt: Date } | { gt: Date }
type TDate = TDateRange | TDateRange[] | TDateOpen

const normalizeSingleDateMode = (raw: string): 'lt' | 'lte' | 'eq' | 'gte' | 'gt' => {
  const m = raw.toLowerCase()
  if (m === 'exact' || m === 'single') return 'eq'
  if (m === 'before') return 'lt'
  if (m === 'after') return 'gt'
  if (m === 'lt' || m === 'lte' || m === 'eq' || m === 'gte' || m === 'gt') return m
  return 'eq'
}

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
  const mode = normalizeSingleDateMode((query[key + 'Mode'] ?? 'eq').toString().trim())

  // array of dates (multiple)
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

  const [start, end] = dateStr.split(',').map((s: string) => s.trim())
  if (start && end) {
    return {
      gte: startOfDay(new Date(start)),
      lte: endOfDay(new Date(end))
    }
  }

  const dayStart = startOfDay(new Date(start))
  const dayEnd = endOfDay(new Date(start))

  if (mode === 'lt') return { lt: dayStart }
  if (mode === 'lte') return { lte: dayEnd }
  if (mode === 'gt') return { gt: dayEnd }
  if (mode === 'gte') return { gte: dayStart }
  return { gte: dayStart, lte: dayEnd }
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

type TInput = {
  [x: string]: TMaybe<
    TZId | TZIds | TZBoolean | TZDate | TZDateObject | TZOrderBy | string | number | boolean | Date
  >
}

export const getWhere2 = <Where = any, Input extends TInput = TInput>(
  input: Input,
  where: Where = {} as Where
) => {
  let scope: (where: Where) => Where = v => v
  return {
    id<InputKey extends keyof Input, WhereKey extends keyof Where>(
      key: InputKey,
      field:
        | WhereKey
        | ((id: NonNullable<Input[InputKey]>) => Partial<Where>) = key as unknown as WhereKey
    ) {
      const id = input[key]
      if (id) {
        if (typeof field === 'function') {
          where = { ...where, ...field(id) }
        } else {
          where = { ...where, [field]: id }
        }
      }
      return this
    },
    text<InputKey extends keyof Input, WhereKey extends keyof Where>(
      key: InputKey,

      field:
        | WhereKey
        | WhereKey[]
        | ((text: string, mode: string) => Partial<Where>) = key as unknown as WhereKey
    ) {
      const { text, textMode } = getText(input, key as string)
      if (text) {
        if (typeof field === 'function') {
          where = {
            ...where,
            ...field(text, textMode)
          }
        } else if (Array.isArray(field)) {
          where = {
            ...where,
            OR: [
              ...((where as any).OR || []),
              ...field.map(f => ({ [f]: textMode === 'contains' ? { contains: text } : text }))
            ]
          }
        } else {
          where = {
            ...where,
            [field]:
              textMode === 'contains'
                ? {
                    contains: text
                  }
                : text
          }
        }
      }
      return this
    },
    date<InputKey extends keyof Input, WhereKey extends keyof Where>(
      key: InputKey,

      field: WhereKey | ((date: Input[InputKey]) => Partial<Where>) = key as unknown as WhereKey
    ) {
      const date = input[key]
      if (date) {
        if (typeof field === 'function') {
          where = { ...where, ...field(date) }
        } else if (Array.isArray(date)) {
          where = { ...where, OR: [...((where as any).OR || []), ...date.map(d => ({ [key]: d }))] }
        } else {
          where = { ...where, [field]: date }
        }
      }
      // return this
      return this
    },
    extend(and: Where) {
      where = {
        ...where,
        ...and
      }
      return this
    },
    scope(cb: (where: Where) => Where) {
      scope = cb
      return this
    },
    get() {
      return scope(where)
    }
  }
}
