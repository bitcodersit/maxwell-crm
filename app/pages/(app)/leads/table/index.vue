<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import type { TLead } from '~~/shared/types/Lead'

definePageMeta({
  title: 'Leads',
  layout: 'leads-layout'
})

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

const drawerOpen = ref(false)
const editingLead = ref<TLead | null>(null)

function openEditLead(lead: TLead) {
  editingLead.value = lead
  drawerOpen.value = true
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
})

const formatStatus = (status?: string | null) => {
  if (!status) return '—'
  return status.split('_').join(' ')
}

const formatBudget = (lead: TLead) => {
  const min = lead.budgetMin == null ? null : Number(lead.budgetMin)
  const max = lead.budgetMax == null ? null : Number(lead.budgetMax)
  if (min == null && max == null) return '—'
  if (min != null && max != null) {
    return `${numberFormatter.format(min)} - ${numberFormatter.format(max)}`
  }
  if (min != null) return `From ${numberFormatter.format(min)}`
  return `Up to ${numberFormatter.format(max as number)}`
}

const getSalesman = (lead: TLead) => {
  const direct = lead.assignable?.assignedUsers?.[0]?.user?.name
  if (direct) return direct
  const teamMember = lead.assignable?.assignedTeams?.[0]?.team?.members?.[0]?.user?.name
  return teamMember || '—'
}

const columns = computed<TColumn<TLead>[]>(() => [
  { id: 'select', size: 48 },
  {
    accessorKey: 'sid',
    header: 'Lead ID',
    pinned: 'left',
    sortBy: 'serialCode',
    size: 100
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    sortBy: 'customerName',
    cell: ({ row }) => row.original.customer?.name || '—'
  },
  {
    accessorKey: 'customer',
    header: 'Phone',
    cell: ({ row }) => row.original.customer?.phone || '—'
  },
  {
    accessorKey: 'source',
    header: 'Source',
    sortBy: 'source',
    cell: ({ row }) => row.original.source?.name || '—'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortBy: 'status',
    cell: ({ row }) =>
      h(UBadge, {
        label: formatStatus(row.original.status),
        color: ColorsMap[row.original.status] || 'neutral',
        variant: 'soft',
        size: 'sm'
      })
  },
  {
    accessorKey: 'propertyTypeMain',
    header: 'Property',
    sortBy: 'propertyTypeMain',
    cell: ({ row }) => {
      const main = row.original.propertyTypeMain?.name
      const sub = row.original.propertyTypeSub?.name
      if (!main && !sub) return '—'
      return [main, sub].filter(Boolean).join(' · ')
    }
  },
  {
    accessorKey: 'budgetMin',
    header: 'Budget',
    sortBy: 'budgetRange',
    cell: ({ row }) => formatBudget(row.original)
  },
  {
    accessorKey: 'assignable',
    header: 'Salesman',
    sortBy: 'assignedSalesman',
    cell: ({ row }) => getSalesman(row.original)
  },
  //   {
  //     accessorKey: 'followUpDate',
  //     header: 'Follow-up',
  //     sortBy: 'followUpDate',
  //     cell: ({ row }) => row.original.followUpDate || '—'
  //   },
  { id: 'action', pinned: 'right' }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: { placeholder: 'Search customer, phone or lead ID…' }
  },
  {
    name: 'status',
    type: 'inline-input',
    props: { placeholder: 'Status (e.g. Hot, Warm)…' }
  },
  {
    name: 'source',
    type: 'input',
    props: { label: 'Source', placeholder: 'Facebook, Website…' }
  },
  {
    name: 'area',
    type: 'input',
    props: { label: 'Area', placeholder: 'Location' }
  },
  {
    name: 'assignedSalesman',
    type: 'input',
    props: { label: 'Salesman', placeholder: 'Assigned salesman' }
  }
]

const getActions: TGetActions<TLead> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, { modal: { ui: { content: 'max-w-2xl' } } })
      }
    },
    {
      ...actions.update,
      onSelect() {
        openEditLead(item)
      }
    }
  ].filter(action => !('hidden' in action) || !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]
</script>

<template>
  <div class="flex-1 flex flex-col px-4 pb-4 overflow-hidden">
    <BaseCrud
      ref="crudRef"
      get-url="/api/leads"
      delete-url="/api/leads/{id}"
      :show-add-button="false"
      :fields="[]"
      :columns="columns"
      :filters="filters"
      :get-actions="getActions"
    />
  </div>
</template>
