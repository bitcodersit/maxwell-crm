import z from 'zod'

export type TZIds = z.infer<ReturnType<typeof zIds>>
export const zIds = () => {
  return z.preprocess(
    v => {
      if (Array.isArray(v)) {
        if (!v.length) return undefined
        return { in: v }
      }
      if (typeof v === 'string') {
        const str = (v as string).trim()
        if (str.includes('-') && !str.startsWith('-')) {
          const [start, end] = str.split('-')
          return {
            gte: start,
            lte: end
          }
        }
        const ids = str.split(',').filter(Boolean)
        if (!ids.length) return undefined
        return { in: ids }
      }
      if (typeof v === 'number' && v) {
        return { in: [v] }
      }
      return undefined
    },
    z
      .union([
        z.object({
          in: z.array(zId())
        }),
        z.object({
          gte: zId(),
          lte: zId()
        })
      ])
      .nullish()
  )
}
