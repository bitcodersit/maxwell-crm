import type { ZodType } from 'zod'

export const zArray = <T extends ZodType>(array: T) => {
  return z.preprocess(value => {
    if (typeof value === 'string') {
      const str = value.trim()
      const [parsed] = jsonParse(str)
      if (Array.isArray(parsed)) {
        return parsed
      }
      if (str.includes(',')) {
        return str.split(',')
      }
      return str ? [str] : undefined
    }
    return value
  }, array)
}
