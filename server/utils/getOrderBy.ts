type TOrderBy = Record<string, 'asc' | 'desc'>

export const getOrderBy = <T extends TOrderBy | TOrderBy[]>(query: any, orderBy?: T) => {
  let v: Record<string, 'asc' | 'desc'> = {}
  try {
    const parsed = JSON.parse(query.orderBy || '{}')
    if (parsed && typeof parsed === 'object') {
      v = parsed as Record<string, 'asc' | 'desc'>
    }
  } catch {}
  return {
    orderBy: Object.keys(v).length
      ? (Object.entries(v).map(([key, value]) => ({
          [key]: value,
        })) as T)
      : orderBy,
  }
}
