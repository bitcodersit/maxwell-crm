import type { TLead, TLeadStatus } from '~~/shared/types/Lead'

const STORAGE_KEY = 'maxwell-crm:leads'

export const LEAD_STATUSES: TLeadStatus[] = [
  'Hot',
  'Warm',
  'Cold',
  'Not Interested',
  'Closed'
]

export const LEAD_SOURCES = [
  'Facebook',
  'Website',
  'Phone',
  'Referral',
  'Walk-in'
] as const

export const PROPERTY_TYPE_MAIN = ['Land', 'Land Share', 'Commercial Plot'] as const
export const PROPERTY_TYPE_SUB = ['Ready', 'Ongoing', 'Installment'] as const

export const SALESMEN = ['Karim H.', 'Ritu A.', 'Nabil R.'] as const

export function useLeadsStore() {
  const leads = useState<TLead[]>('leads-local', () => [])
  const ready = useState('leads-local-ready', () => false)
  const loading = useState('leads-local-loading', () => false)

  const persist = () => {
    if (import.meta.client) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(leads.value))
    }
  }

  const loadFromStorage = () => {
    if (!import.meta.client) return false
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false
    try {
      const parsed = JSON.parse(raw) as TLead[]
      if (Array.isArray(parsed) && parsed.length) {
        leads.value = parsed
        return true
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
    return false
  }

  const refreshFromApi = async () => {
    loading.value = true
    try {
      const res = await $fetch<TPaginated<TLead>>('/api/leads', {
        query: { paginate: false }
      })
      const items = Array.isArray(res) ? res : res.data
      leads.value = items
      persist()
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  const init = async (force = false) => {
    if (ready.value && !force) return
    // localStorage + authenticated $fetch are client-only
    if (!import.meta.client) return
    if (!force && loadFromStorage()) {
      ready.value = true
      return
    }
    await refreshFromApi()
  }

  const upsert = async (input: Partial<TLead> & { id?: number }) => {
    const saved = await $fetch<TLead>('/api/leads', {
      method: 'POST',
      body: input
    })
    const index = leads.value.findIndex(l => l.id === saved.id)
    if (index >= 0) {
      leads.value[index] = saved
    } else {
      leads.value.unshift(saved)
    }
    persist()
    return saved
  }

  const updateStatus = async (id: number, status: TLeadStatus) => {
    const saved = await $fetch<TLead>(`/api/leads/${id}`, {
      method: 'PATCH',
      body: { status }
    })
    const index = leads.value.findIndex(l => l.id === id)
    if (index >= 0) {
      leads.value[index] = saved
    }
    persist()
    return saved
  }

  const remove = async (id: number) => {
    await $fetch(`/api/leads/${id}`, { method: 'DELETE' })
    leads.value = leads.value.filter(l => l.id !== id)
    persist()
  }

  const leadsByStatus = computed(() => {
    return LEAD_STATUSES.reduce(
      (acc, status) => {
        acc[status] = leads.value.filter(l => l.status === status)
        return acc
      },
      {} as Record<TLeadStatus, TLead[]>
    )
  })

  return {
    leads,
    ready,
    loading,
    leadsByStatus,
    init,
    persist,
    refreshFromApi,
    upsert,
    updateStatus,
    remove
  }
}
