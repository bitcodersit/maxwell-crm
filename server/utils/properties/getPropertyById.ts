import { selectPropertyForDisplay } from './select'

export const getPropertyById = async (id: number) => {
  const property = await prisma.property.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: selectPropertyForDisplay
  })
  if (!property) throw err.notFound()
  return property
}
