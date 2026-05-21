import { z } from 'zod'

const propertyStatuses = ['Available', 'Hold', 'Sold'] as const

const zOptionalText = z.preprocess(value => {
  if (value === null || value === undefined) return undefined
  if (typeof value !== 'string') return value
  const normalized = value.trim()
  return normalized.length ? normalized : undefined
}, z.string().optional())

const zNullableNumber = z.preprocess(
  value => (value === '' || value === null || value === undefined ? null : value),
  z.coerce.number().nonnegative().nullable()
)

const zPatchNumber = z.preprocess(value => {
  if (value === undefined) return undefined
  if (value === '' || value === null) return null
  return value
}, z.coerce.number().nonnegative().nullable())

const zPropertyAddress = z.object({
  id: zId().nullish(),
  name: z.string().nullish(),
  addressLine1: z.string().trim().min(1, 'Location is required!'),
  road: z.string().default(''),
  block: z.string().default('')
})

const zIdArray = z.preprocess(value => {
  const values = Array.isArray(value)
    ? value
    : value === undefined || value === null || value === ''
      ? []
      : String(value)
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
  const ids = values.map(item => Number(item)).filter(id => Number.isInteger(id) && id > 0)
  return ids
}, z.array(z.number().int().positive()))

const zStatusArray = z.preprocess(
  value => {
    const values = Array.isArray(value)
      ? value
      : value === undefined || value === null || value === ''
        ? []
        : String(value)
            .split(',')
            .map(item => item.trim())
            .filter(Boolean)

    return values.filter(item =>
      propertyStatuses.includes(item as (typeof propertyStatuses)[number])
    )
  },
  z.array(z.enum(propertyStatuses))
)

const zPropertyPayload = z.object({
  name: z.string().trim().min(1, 'Property name is required'),
  facing: zOptionalText,
  price: z.coerce.number().nonnegative().default(0),
  previousPrice: zNullableNumber,
  status: z.enum(propertyStatuses).default('Available'),
  purchaseTypeId: zId().nullish(),
  katha: z.coerce.number().nonnegative().default(0),
  sqft: z.coerce.number().nonnegative().default(0),
  addressId: zId().nullish(),
  address: zPropertyAddress.nullish()
})

export const zCreateProperty = zPropertyPayload.refine(data => !!data.addressId || !!data.address, {
  message: 'Address is required',
  path: ['addressLine1']
})

export type TZCreateProperty = z.infer<typeof zCreateProperty>

export const zUpdateProperty = z.object({
  name: z.string().trim().min(1, 'Property name is required').optional(),
  facing: zOptionalText,
  price: zPatchNumber.optional(),
  previousPrice: zPatchNumber.optional(),
  status: z.enum(propertyStatuses).optional(),
  purchaseTypeId: zId().nullish(),
  katha: zPatchNumber.optional(),
  sqft: zPatchNumber.optional(),
  addressId: zId().nullish(),
  address: zPropertyAddress.nullish()
})

export type TZUpdateProperty = z.infer<typeof zUpdateProperty>

export const zGetProperties = z
  .object({
    q: zOptionalText,
    id: zIdArray.optional(),
    status: zStatusArray.optional(),
    name: zOptionalText,
    purchaseTypeId: zIdArray.optional()
  })
  .and(zOrderable({ id: 'desc' }))
  .and(zPagination())

export type TZGetProperties = z.infer<typeof zGetProperties>

export const zPropertyIdParam = z.object({
  id: zId('Invalid property id')
})

export type TZPropertyIdParam = z.infer<typeof zPropertyIdParam>

export const zPropertyIdsParam = z.object({
  id: zIdArray.pipe(
    z.array(z.number().int().positive()).min(1, 'At least one property id is required')
  )
})

export type TZPropertyIdsParam = z.infer<typeof zPropertyIdsParam>
