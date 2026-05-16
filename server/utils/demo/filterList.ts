type TOrderDir = 'asc' | 'desc'

const getText = (query: Record<string, unknown>, key: string) => {
  return (query[key] || '').toString().trim().toLowerCase()
}

const matchText = (value: string | null | undefined, text: string, mode = 'contains') => {
  if (!text) return true
  const v = (value || '').toLowerCase()
  if (mode === 'exact') return v === text
  if (mode === 'starts') return v.startsWith(text)
  return v.includes(text)
}

export const filterList = <T extends Record<string, unknown>>(
  items: T[],
  query: Record<string, unknown>,
  config: {
    searchKeys: (keyof T)[]
    textFilters?: { key: keyof T; queryKey: string }[]
    arrayFilters?: { key: keyof T; queryKey: string }[]
  }
) => {
  let result = [...items]

  const q = getText(query, 'q')
  if (q) {
    result = result.filter(item =>
      config.searchKeys.some(key => matchText(String(item[key] ?? ''), q))
    )
  }

  for (const { key, queryKey } of config.textFilters || []) {
    const text = getText(query, queryKey)
    const mode = (query[`${queryKey}Mode`] || 'contains').toString()
    if (text) {
      result = result.filter(item => matchText(String(item[key] ?? ''), text, mode))
    }
  }

  for (const { key, queryKey } of config.arrayFilters || []) {
    const raw = query[queryKey]
    if (!raw) continue
    const values = (Array.isArray(raw) ? raw : [raw]).map(v => v.toString())
    if (values.length) {
      result = result.filter(item => values.includes(String(item[key] ?? '')))
    }
  }

  return result
}

export const sortList = <T extends Record<string, unknown>>(
  items: T[],
  orderBy: Record<string, TOrderDir | undefined> = {}
) => {
  const [field, dir] = Object.entries(orderBy).find(([, v]) => v) || []
  if (!field || !dir) {
    return items
  }

  return [...items].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av == null && bv == null) return 0
    if (av == null) return dir === 'asc' ? -1 : 1
    if (bv == null) return dir === 'asc' ? 1 : -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return dir === 'asc' ? av - bv : bv - av
    }
    const as = String(av)
    const bs = String(bv)
    return dir === 'asc' ? as.localeCompare(bs) : bs.localeCompare(as)
  })
}

export const nextSerialCode = (prefix: string, items: { serialCode: string }[]) => {
  const nums = items
    .map(item => {
      const match = item.serialCode.match(/(\d+)$/)
      return match ? Number(match[1]) : 0
    })
    .filter(n => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}
