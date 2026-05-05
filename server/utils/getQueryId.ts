export const getQueryId = (
  query: any,
  key: string
): { in: number[] } | { lte: number; gte: number } | undefined => {
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
    return {
      gte: Number(start),
      lte: Number(end),
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
