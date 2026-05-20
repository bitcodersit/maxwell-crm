import { z } from 'zod'

export type TOrderBy = Record<string, 'asc' | 'desc'>
export type TZOrderBy = z.infer<typeof zOrderBy>

export const zOrderBy = (defaultOrderBy: TOrderBy = { id: 'desc' }) => {
  return z.object({
    orderBy: z
      .transform<TOrderBy>(text => {
        if (typeof text === 'string') {
          try {
            const parsed = JSON.parse(text)
            return typeof parsed === 'object' ? parsed : undefined
          } catch {
            return undefined as any
          }
        }
        if (typeof text !== 'object') {
          return undefined
        }
        return text
      })
      .default(defaultOrderBy)
  })
}
