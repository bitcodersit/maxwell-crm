export function normalizePaginated<T>(res: TPaginated<T> | T[]): TPaginated<T> {
  if (Array.isArray(res)) {
    const total = res.length
    return {
      page: 1,
      total,
      perPage: total || 10,
      totalPages: 1,
      firstPage: 1,
      lastPage: 1,
      nextPage: null,
      previousPage: null,
      hasNextPage: false,
      hasPreviousPage: false,
      data: res
    }
  }
  return res
}

export function emptyPaginated<T>(): TPaginated<T> {
  return normalizePaginated<T>([])
}
