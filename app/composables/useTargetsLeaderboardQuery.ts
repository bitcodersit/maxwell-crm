export const useTargetsLeaderboardQuery = (query: MaybeRefOrGetter<Record<string, any>>) => {
  const $fetch = useRequestFetch()
  return useQuerySSR({
    queryKey: keys.targetsLeaderboard(query),
    queryFn: () =>
      $fetch<{
        period: string
        group: string
        rangeStart: string
        rangeEnd: string
        data: {
          rank: number
          userId?: number
          teamId?: number
          name: string
          avatar?: { path: string } | null
          assigned: number
          achieved: number
          missed: number
          skipped: number
          hitRate: number
          fillUpPercent: number
          active: number
        }[]
      }>('/api/targets/leaderboard', {
        query: toValue(query)
      }),
    initialData: () => ({
      period: 'month',
      group: 'users',
      rangeStart: '',
      rangeEnd: '',
      data: []
    })
  })
}
