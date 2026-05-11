export const useQuerySSR = (options => {
  const query = useQuery(options)
  onServerPrefetch(async () => {
    await query.suspense()
  })
  return query
}) as typeof useQuery
