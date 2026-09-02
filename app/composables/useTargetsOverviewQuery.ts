type TTargetsOverview = typeof initialData
const initialData = {
  summary: {
    running: 0,
    paused: 0,
    new: 0,
    achievedMonth: 0,
    missedMonth: 0,
    skippedMonth: 0,
    fillUpPercent: 0,
    hitRate: 0,
    missRate: 0,
    hitEligible: 0
  },
  weekly: {
    achieved: 0,
    missed: 0,
    skipped: 0,
    remaining: 0,
    total: 0,
    percent: 0
  },
  monthly: {
    achieved: 0,
    missed: 0,
    skipped: 0,
    remaining: 0,
    total: 0,
    percent: 0
  },
  performers: [] as {
    userId: number
    name: string
    avatar: { path: string } | null
    active: number
    assigned: number
    achieved: number
    hitRate: number
  }[]
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
