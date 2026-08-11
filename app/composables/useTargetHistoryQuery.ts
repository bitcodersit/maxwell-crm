export type TTargetHistoryCycle = {
  id: number
  name: string
  status: TaskStatus
  dueAt: Date | string | null
  createdAt: Date | string
  reviewedAt?: Date | string | null
  submittedAt?: Date | string | null
  totalItems: number
  completedItems: number
  fillUpPercent: number
  isFilledUp: boolean
  items: {
    id: number
    name: string
    status: TaskItemStatus
    completedAt: Date | string | null
  }[]
}

export const useTargetHistoryQuery = (id: MaybeRefOrGetter<number>, enabled: MaybeRefOrGetter<boolean>) => {
  const $fetch = useRequestFetch()
  return useQuerySSR({
    enabled: computed(() => toValue(enabled) && toValue(id) > 0),
    queryKey: keys.targetHistory(id),
    queryFn: () => $fetch<TTargetHistoryCycle[]>(`/api/targets/${toValue(id)}/history`),
    initialData: () => [] as TTargetHistoryCycle[]
  })
}
