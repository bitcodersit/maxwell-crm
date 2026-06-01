import { generateKeyBetween } from 'fractional-indexing'

export const getSortOrder = (a: TMaybe<string>, b?: TMaybe<string>) => {
  let key: string | undefined
  try {
    key = generateKeyBetween(a ?? null, b ?? null)
  } catch {
    key = generateKeyBetween(b ?? null, a ?? null)
  }
  return key
}
