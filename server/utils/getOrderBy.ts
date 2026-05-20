import type { TZOrderBy } from './zOrderBy'

type TOrderBy = Record<string, 'asc' | 'desc'>

export const getOrderBy = <T extends TOrderBy | TOrderBy[]>(query: TZOrderBy, orderBy?: T) => {
  let v: Record<string, 'asc' | 'desc'> = {}
  try {
    if (typeof query.orderBy === 'string') {
      const parsed = JSON.parse(query.orderBy || '{}')
      if (parsed && typeof parsed === 'object') {
        v = parsed as Record<string, 'asc' | 'desc'>
      }
    } else {
      v = query.orderBy
    }
  } catch {
    /* empty */
  }
  return {
    orderBy: Object.keys(v).length
      ? (Object.entries(v).map(([key, value]) => ({
          [key]: value
        })) as T)
      : orderBy
  }
}
