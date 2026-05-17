import { generateKeyBetween } from 'fractional-indexing'

const BASE_62_DIGITS = '0123456789abcdefghijklmnopqrstuvwxyz'

export const getSortOrder = (a: TMaybe<string>, b: TMaybe<string>) => {
  let key: string | undefined
  try {
    key = generateKeyBetween(a ?? null, b ?? null, BASE_62_DIGITS)
  } catch {
    key = generateKeyBetween(b ?? null, a ?? null, BASE_62_DIGITS)
  }
  return key
}
