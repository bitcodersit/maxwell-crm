import type { TFilter } from '@/components/base/BaseCrud.vue'

const formatFilterStatus = (name?: string) => {
  if (!name) return '—'
  return name.split('_').join(' ')
}

export const leadListFilters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: { placeholder: 'Search customer, phone or lead ID…' }
  },
  {
    name: 'status',
    type: 'checkbox-api',
    props: {
      label: 'Status',
      api: '/api/enums',
      query: { type: 'LeadStatus' },
      getLabel: item => formatFilterStatus(item.name)
    }
  },
  {
    name: 'area',
    type: 'input',
    props: { label: 'Area', placeholder: 'Gulshan, Banani…', modeable: true }
  },
  {
    name: 'users',
    type: 'checkbox-api',
    props: {
      label: 'Salesman',
      api: '/api/users',
      query: { options: true, roleNames: 'Salesman' }
    }
  },
  {
    name: 'budgetMin',
    type: 'input',
    props: { label: 'Budget min', placeholder: 'e.g. 5000000' }
  },
  {
    name: 'budgetMax',
    type: 'input',
    props: { label: 'Budget max', placeholder: 'e.g. 10000000' }
  }
]
