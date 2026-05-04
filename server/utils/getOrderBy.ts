type TOrderBy = Record<string, 'asc' | 'desc'>

export const getOrderBy = <T extends TOrderBy | TOrderBy[]>(query: any, orderBy?: T) => {
  const v = JSON.parse(query.orderBy || '{}')
  return {
    orderBy: Object.keys(v).length
      ? (Object.entries(v).map(([key, value]) => ({
          [key]: value,
        })) as T)
      : orderBy,
  }
}
