import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js'
import { z } from 'zod'

export const zId = (message = 'Invalid ID') => {
  return z.number(message).int(message).positive(message)
}

export const zName = (message = 'Name is required!', length = 3) =>
  z.string().trim().min(length, message)
export const zEmail = (message = 'Invalid email address') => z.email(message)
export const zPassword = (message = 'Password must be at least 8 characters long', length = 8) =>
  z.string().trim().min(length, message)

export const zColor = (message = 'Invalid color') =>
  z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, message)
    .trim()

export const zPhone = (props?: string | { nullish?: boolean; message?: string }) => {
  const { nullish = false, message = 'Invalid phone number' } =
    typeof props === 'object' ? props : { nullish: false, message: props }
  return z.custom<string>(value => {
    if (nullish && !value) return true
    if (typeof value !== 'string') return false
    if (value.length < 11) return false
    return isValidPhoneNumber(value, 'BD')
  }, message)
}

export const zPhoneParse = (value: string) => {
  return parsePhoneNumberWithError(value, 'BD').number
}

export const zDate = (message = 'Invalid date') => {
  return z.coerce.date(message)
}

export const zDateRequired = (message = 'Date is required!') => {
  return z.preprocess(
    (v: unknown) => (v === null || v === undefined || v === '' ? undefined : v),
    zDate(message)
  )
}

export const zSortOrder = (message = 'Sort order is required!') => {
  return z.union([
    z.string().min(1, message),
    z.array(z.string().min(1, message).nullable()).length(2, message)
  ])
}

export const zBoolean = (message = 'Invalid boolean') => {
  return z.coerce.boolean(message)
}

export { z }
