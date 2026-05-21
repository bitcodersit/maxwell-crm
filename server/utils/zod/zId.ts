export const zId = (message = 'Invalid id') => {
  return z.coerce.number(message).int(message).positive(message).min(1, message)
}
