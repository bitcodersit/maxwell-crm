import { isValidPhoneNumber, parsePhoneNumberWithError } from 'libphonenumber-js'
import { z } from 'zod'

export const zName = (message = 'Name is required!', length = 3) => z.string().min(length, message)
export const zEmail = (message = 'Invalid email address') => z.email(message)
export const zPassword = (message = 'Password must be at least 8 characters long', length = 8) =>
  z.string().min(length, message)

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

export { z }
