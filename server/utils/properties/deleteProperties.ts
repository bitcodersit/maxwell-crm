export const deleteProperties = async (ids: number[]) => {
  const data = await prisma.property.updateMany({
    where: {
      id: {
        in: ids
      },
      deletedAt: null
    },
    data: {
      deletedAt: new Date()
    }
  })
  if (!data.count) throw err.notFound()
  return data
}
