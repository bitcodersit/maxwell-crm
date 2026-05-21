import type { E164Number } from 'libphonenumber-js'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import { z } from 'zod'

export const zName = (message = 'Name is required!', length = 3) =>
  z.string().trim().min(length, message)

export const zPassword = (message = 'Password must be at least 8 characters long', length = 8) =>
  z.string().trim().min(length, message)

export const zColor = (message = 'Invalid color') =>
  z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, message)
    .trim()

type TUniqueOptions = {
  unique?: boolean
  message?: string
  uniqueMessage?: string
}
export const zEmail = (options?: TUniqueOptions) => {
  const {
    unique = false,
    message = 'Invalid email address',
    uniqueMessage = 'Email already in use'
  } = options ?? {}
  return z.email(message).refine(async email => {
    if (!unique) return true
    return !(await prisma.user.findFirst({
      where: { email }
    }))
  }, uniqueMessage)
}

export const zPhone = (options?: TUniqueOptions) => {
  const {
    unique = false,
    message = 'Invalid phone number',
    uniqueMessage = 'Phone number already in use'
  } = options ?? {}
  return z
    .string(message)
    .transform<E164Number>(async (value): Promise<any> => {
      if (value.length < 11 || value.length > 14) {
        return [message]
      }
      const phone = parsePhoneNumberWithError(value, 'BD')
      if (!phone.isValid()) {
        return [message]
      }
      if (
        unique &&
        (await prisma.user.findFirst({
          where: {
            phone: phone.number
          }
        }))
      ) {
        return [uniqueMessage]
      }
      return phone.number
    })
    .superRefine(async (value, ctx) => {
      if (Array.isArray(value)) {
        ctx.addIssue(value[0]!)
      }
    })
}

export const zSortOrder = (message = 'Sort order is required!') => {
  return z.union([
    z.string().min(1, message),
    z.array(z.string().min(1, message).nullable()).length(2, message)
  ])
}

export { z }
