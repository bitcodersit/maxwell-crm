export const getPagination = (query: any) => {
  const paginate = query.paginate ? isTrue(query.paginate) : true

  const page = Number(query.page) || 1
  const take = Number(query.perPage) || 10
  const skip = (page - 1) * take

  return {
    skip: paginate ? skip : undefined,
    take: paginate ? take : undefined,
    paginate<T>(data: T[], total = data.length) {
      if (!paginate) return data
      return {
        page,
        total,
        perPage: take,
        totalPages: Math.ceil(total / take),
        firstPage: 1,
        lastPage: Math.ceil(total / take),
        nextPage: page + 1,
        previousPage: page - 1,
        hasNextPage: page < Math.ceil(total / take),
        hasPreviousPage: page > 1,
        data,
      }
    },
  }
}
