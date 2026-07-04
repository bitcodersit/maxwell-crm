import { normalizePaginated } from '~/utils/pagination'

export function useLeadDetailData(leadId: MaybeRef<string>) {
  const id = computed(() => toValue(leadId))
  const $fetch = useRequestFetch()

  const { data, error, isPending, isFetching, refetch } = useQuerySSR({
    retry: false,
    queryKey: keys.leadDetail(id),
    enabled: computed(() => !!id.value),
    queryFn: async (): Promise<TLeadDetailData> => {
      const lead = await $fetch<TLead>(`/api/leads/${id.value}`)

      const [followUpsRes, visitsRes, commentsRes] = await Promise.all([
        $fetch<TPaginated<TFollowUp> | TFollowUp[]>('/api/followups', {
          query: {
            leadId: lead.id,
            paginate: false
          }
        }),
        $fetch<TPaginated<TVisit> | TVisit[]>('/api/visits', {
          query: {
            leadId: lead.id,
            paginate: false
          }
        }),
        $fetch<TPaginated<TComment> | TComment[]>('/api/comments', {
          query: {
            commentableModelType: 'lead',
            commentableModelId: lead.id,
            paginate: false
          }
        })
      ])

      const linkedProperties = (lead.properties ?? [])
        .map(row => row.property)
        .filter((property): property is TProperty => !!property)

      return {
        lead,
        followUps: normalizePaginated(followUpsRes),
        visits: normalizePaginated(visitsRes),
        comments: normalizePaginated(commentsRes),
        attachments: lead.attachable?.attachments ?? [],
        properties: normalizePaginated(linkedProperties)
      }
    }
  })

  const isLoading = computed(() => isPending.value || (isFetching.value && !data.value))

  return {
    data,
    error,
    isLoading,
    isFetching,
    refresh: refetch
  }
}
