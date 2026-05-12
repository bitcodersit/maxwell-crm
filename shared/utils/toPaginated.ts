export const toPaginated = <T>(
  data: T[] = [],
  total: number = data.length,
  page: number = 1,
  perPage: number = 10
): TPaginated<T> => {
  const lastPage = Math.ceil(total / perPage)
  const hasPreviousPage = page > 1
  const hasNextPage = page < lastPage
  return {
    page,
    total,
    perPage,
    lastPage,
    totalPages: lastPage,
    firstPage: 1,
    previousPage: hasPreviousPage ? page - 1 : null,
    nextPage: hasNextPage ? page + 1 : null,
    hasNextPage,
    hasPreviousPage,
    data
  }
}
