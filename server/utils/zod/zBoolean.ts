import z from 'zod'

/**
 * Zod schema to only allow truth values and parse to boolean (is true)
 * @param m - Error message
 * @returns - boolean
 */
export const zTrue = (m = 'Invalid boolean value') => {
  return z.custom<boolean>(v => isTrue(v), m).transform<boolean>(isTrue)
}

/**
 * Zod schema to only allow false values and parse to boolean (is false)
 * @param m - Error message
 * @returns - boolean
 */
export const zFalse = (m = 'Invalid boolean value') => {
  return z.custom<boolean>(v => isFalse(v), m).transform<boolean>(isFalse)
}

/**
 * Zod schema to only allow truth values and parse to boolean
 * @param m - Error message
 * @returns - boolean
 */
export const zBoolean = (m = 'Invalid boolean value') => {
  return z.custom<boolean>(v => isTrue(v) || isFalse(v), m).transform<boolean>(v => isTrue(v))
}

export type TZTrue = z.infer<ReturnType<typeof zTrue>>
export type TZFalse = z.infer<ReturnType<typeof zFalse>>
export type TZBoolean = z.infer<ReturnType<typeof zBoolean>>
