export const toPaginated = <T>(
  data: T[] = [],
  total: number = data.length,
  page: number = 1,
  perPage: number = 10
): TPaginated<T> => {
  return {
    page,
    total,
    perPage,
    totalPages: Math.ceil(total / perPage),
    firstPage: 1,
    lastPage: Math.ceil(total / perPage),
    nextPage: page + 1,
    previousPage: page - 1,
    hasNextPage: page < Math.ceil(total / perPage),
    hasPreviousPage: page > 1,
    data
  }
}
