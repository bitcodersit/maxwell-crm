const isDate = (value: unknown): value is Date => value instanceof Date

const isPlainObject = (value: unknown): value is Record<string, any> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isDate(value)
}

const isDeepEqual = (a: unknown, b: unknown): boolean => {
  if (Object.is(a, b)) return true

  if (isDate(a) || isDate(b)) {
    if (!isDate(a) || !isDate(b)) return false
    return a.getTime() === b.getTime()
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isDeepEqual(a[i], b[i])) return false
    }
    return true
  }

  if (isPlainObject(a) || isPlainObject(b)) {
    if (!isPlainObject(a) || !isPlainObject(b)) return false
    const aKeys = Object.keys(a)
    const bKeys = Object.keys(b)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!(key in b)) return false
      if (!isDeepEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

/**
 * Returns a partial object containing only changed keys from `next` vs `prev`.
 * For arrays and nested objects, if any nested value differs, the full property is returned.
 */
export const getDeepDiff = <T extends Record<string, any>>(
  next: T,
  prev?: Partial<T> | null
): Partial<T> => {
  const diff: Partial<T> = {}
  for (const key of Object.keys(next) as Array<keyof T>) {
    if (!isDeepEqual(next[key], prev?.[key])) {
      diff[key] = next[key]
    }
  }
  return diff
}

