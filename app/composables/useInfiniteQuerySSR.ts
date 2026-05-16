export const useInfiniteQuerySSR = (options => {
  const query = useInfiniteQuery(options)
  onServerPrefetch(async () => {
    const enabled =
      'enabled' in options
        ? typeof options.enabled === 'function'
          ? true // options.enabled()
          : options.enabled
        : true
    if (typeof enabled !== 'function' && toValue(enabled)) {
      await query.suspense()
    }
  })
  return query
}) as typeof useInfiniteQuery
