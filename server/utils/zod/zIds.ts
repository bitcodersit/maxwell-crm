import z from 'zod'

export type TZIds = z.infer<typeof zIds>
export const zIds = () => {
  return z.preprocess(
    v => {
      if (Array.isArray(v)) {
        return {
          in: v
        }
      }
      if (typeof v === 'string') {
        const str = (v as string).trim()
        if (str.includes('-') && !str.startsWith('-')) {
          const [start, end] = str.split('-')
          return {
            range: {
              gte: start,
              lte: end
            }
          }
        }
        return {
          in: str.split(',').filter(Boolean)
        }
      }
      if (typeof v === 'number') {
        return {
          in: [v]
        }
      }
      return {}
    },
    z.object({
      in: z.array(zId()).optional(),
      range: z
        .object({
          gte: zId(),
          lte: zId()
        })
        .optional()
    })
  )
}
