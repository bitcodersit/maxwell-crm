import type { ZodType } from 'zod'

export const validate = async <T extends ZodType>(body: Record<string, unknown>, schema: T) => {
  const result = await schema.safeParseAsync(body)
  if (!result.success) {
    throw err.zod(result.error)
  }
  return result.data
}
