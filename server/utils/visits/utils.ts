import { z } from 'zod'

export const zVisitLeadOrProperty = z
  .object({
    leadId: zId().nullish(),
    propertyId: zId().nullish()
  })
  .refine(data => data.leadId || data.propertyId, {
    message: 'Either leadId or propertyId is required'
  })

export const getScopedVisit: TScopeFn<Prisma.VisitWhereInput> = (where, user) => {
  if (user.readAnyVisits) return where
  return {
    AND: [
      where,
      {
        OR: [scopeIsAuthor(user), ...scopeIsAssigned(user)]
      }
    ]
  }
}
