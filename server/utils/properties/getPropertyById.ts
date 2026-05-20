export const getPropertyById = async (id: number) => {
  const property = await prisma.property.findFirst({
    where: {
      id,
      deletedAt: null
    },
    include: {
      purchaseType: {
        select: {
          id: true,
          name: true
        }
      },
      address: true,
      sizes: {
        include: {
          size: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  })
  if (!property) throw err.notFound()
  return property
}
