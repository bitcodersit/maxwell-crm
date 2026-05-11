export const useQuerySSR = (options => {
  const query = useQuery(options)
  onServerPrefetch(async () => {
    const enabled =
      'enabled' in options
        ? typeof options.enabled === 'function'
          ? options.enabled()
          : options.enabled
        : true
    if (typeof enabled !== 'function' && toValue(enabled)) {
      await query.suspense()
    }
  })
  return query
}) as typeof useQuery
