import z from 'zod'

export type TZId = z.infer<ReturnType<typeof zId>>
export const zId = (message = 'Invalid id') => {
  return z.coerce.number(message).int(message).positive(message).min(1, message)
}
