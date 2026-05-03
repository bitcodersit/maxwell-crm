export const getOrderBy = (query: any) => {
  return {
    orderBy: Object.entries(JSON.parse(query.orderBy || '{}')).map(([key, value]) => ({
      [key]: value,
    })),
  }
}
