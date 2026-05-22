export const getPagination = (query: TZPagination) => {
  const paginate = 'paginate' in query ? isTrue(query.paginate) : true

  const page = Number(query.page) || 1
  const take = Number(query.perPage) || 10
  const skip = (page - 1) * take

  return {
    skip: paginate ? skip : undefined,
    take: paginate ? take : undefined,
    paginate<T>(data: T[], total = data.length) {
      if (!paginate) return data
      return toPaginated(data, total, page, take)
    }
  }
}
