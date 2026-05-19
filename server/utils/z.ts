import type { E164Number } from 'libphonenumber-js'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import { z } from 'zod'

export const zId = (message = 'Invalid ID') => {
  return z
    .union([z.string(message), z.number(message)])
    .transform(val => Number(val))
    .refine(val => Number.isInteger(val) && val > 0, message)
}

export const zName = (message = 'Name is required!', length = 3) =>
  z.string().trim().min(length, message)

export const zPassword = (message = 'Password must be at least 8 characters long', length = 8) =>
  z.string().trim().min(length, message)

export const zColor = (message = 'Invalid color') =>
  z
    .string()
    .regex(/^#([0-9a-fA-F]{6})$/, message)
    .trim()

export const zEmail = (error = 'Invalid email address', error2 = 'Email already in use') => {
  return z.email(error).refine(async email => {
    return !(await prisma.user.findFirst({
      where: { email }
    }))
  }, error2)
}

export const zPhone = (
  message = 'Please enter a valid phone number',
  message2 = 'Phone number already in use.'
) => {
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
        await prisma.user.findFirst({
          where: {
            phone: phone.number
          }
        })
      ) {
        return [message2]
      }
      return phone.number
    })
    .superRefine(async (value, ctx) => {
      if (Array.isArray(value)) {
        ctx.addIssue(value[0]!)
      }
    })
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
