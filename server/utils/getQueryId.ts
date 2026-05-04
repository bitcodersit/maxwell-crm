export const getQueryId = (query: any, key: string): number[] => {
  const value = query[key]
  if (Array.isArray(value)) {
    return (Array.isArray(value) ? value : [value])
      .filter(Boolean)
      .map(Number)
      .filter((v) => !isNaN(v))
  }
  return (query[key] || '')
    .toString()
    .trim()
    .split(',')
    .filter((v: string) => v.trim())
    .map(Number)
    .filter((v: number) => !isNaN(v))
}
