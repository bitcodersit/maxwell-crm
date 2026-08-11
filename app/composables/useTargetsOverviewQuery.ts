type TTargetsOverview = typeof initialData
const initialData = {
  summary: {
    total: 0,
    todo: 0,
    inReview: 0,
    failed: 0,
    cancelled: 0,
    inProgress: 0,
    completed: 0,
    goalEligible: 0,
    goalHit: 0,
    goalFail: 0,
    goalHitRate: 0,
    goalFailRate: 0
  },
  weekly: {
    done: 0,
    total: 0,
    remaining: 0,
    percent: 0,
    changePercent: 0,
    volumeChangePercent: 0
  },
  monthly: {
    completed: 0,
    target: 0,
    remaining: 0,
    percent: 0,
    changePercent: 0,
    volumeChangePercent: 0
  },
  trends: {
    completedWeekOverWeek: 0,
    completedMonthOverMonth: 0
  }
}

export const useTargetsOverviewQuery = () => {
  const $fetch = useRequestFetch()
  const enabled = ref(false)
  onMounted(() => {
    enabled.value = true
  })
  return useQuerySSR({
    enabled,
    initialData,
    queryKey: keys.targetsOverview(),
    queryFn: () => {
      return $fetch<TTargetsOverview>('/api/targets/overview')
    }
  })
}
