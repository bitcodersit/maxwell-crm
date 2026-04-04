export const getOrderBy = (
  query: any,
  defaultOrderBy: string = 'createdAt',
  defaultOrderDirection: 'asc' | 'desc' = 'desc'
) => {
  const orderBy = (query.orderBy || defaultOrderBy).toString().trim()
  const orderDirection = (query.orderDirection || defaultOrderDirection).toString().trim()
  return {
    orderBy: {
      [orderBy]: orderDirection,
    },
  }
}
