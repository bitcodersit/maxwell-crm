import type { H3Event } from 'h3'
import type z from 'zod'

export const getInput = async <S extends z.ZodSchema, I = z.infer<S>>(
  event: H3Event,
  schema: S,
  options?: { input?: I }
) => {
  return (
    options?.input ??
    (await (async () => {
      if (['post', 'put', 'patch'].includes(event.method.toLowerCase())) {
        if (event.headers.get('content-type')?.includes('multipart/form-data')) {
          const fd = await readFormData(event)
          const body = Object.fromEntries(fd.entries())
          if (fd.has('files')) {
            ;(body as any).files = fd.getAll('files')
          }
          return await validate(body, schema)
        }
        return await validate(await readBody(event), schema)
      }
      return await validate(getQuery(event), schema)
    })())
  )
}
