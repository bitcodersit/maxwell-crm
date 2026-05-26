export const zString = (message = 'Invalid string') => {
  return z.string(message).trim()
}
