import { ZodObject } from 'zod'

export const validate = async <T extends ZodObject>(body: any, schema: T) => {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw err.zod(result.error)
  }
  return result.data
}
