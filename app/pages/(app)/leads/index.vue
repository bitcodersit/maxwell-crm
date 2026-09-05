<script setup lang="ts">
import type { TColumn, TGetActions } from '@/components/base/BaseCrud.vue'
import type { TLead } from '~~/shared/types/Lead'
import { leadListFilters } from '@/utils/leads-filters'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')

function leadDetailTo(lead: TLead) {
  return `/leads/${lead.sid}`
}

function goToLead(lead: TLead) {
  navigateTo(leadDetailTo(lead))
}

function leadLinkCell(lead: TLead, label: string) {
  return h(
    NuxtLink,
    {
      to: leadDetailTo(lead),
      class: 'font-medium text-primary hover:underline'
    },
    () => label
  )
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
  const direct = lead.assignable?.users?.[0]?.user?.name
  if (direct) return direct
  const teamMember = lead.assignable?.teams?.[0]?.team?.members?.[0]?.user?.name
  return teamMember || '—'
}

const columns = computed<TColumn<TLead>[]>(() => [
  { id: 'select', size: 48 },
  {
    accessorKey: 'sid',
    header: 'Lead ID',
    pinned: 'left',
    sortBy: 'serialCode',
    size: 100,
    cell: ({ row }) => leadLinkCell(row.original, row.original.sid)
  },
  {
    accessorKey: 'customer',
    header: 'Customer',
    sortBy: 'customerName',
    cell: ({ row }) => {
      const name = row.original.customer?.name
      if (!name) return '—'
      return leadLinkCell(row.original, name)
    }
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

const toast = useToast()
const converting = ref(false)

async function convertLead(lead: TLead) {
  if (converting.value) return
  converting.value = true
  try {
    await $fetch('/api/leads/convert', {
      method: 'PUT',
      body: {
        leadId: lead.id
      }
    })
    toast.add({
      title: 'Convert to Lead',
      description: `Request sent for ${lead.sid}.`,
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      color: 'error',
      description: error?.data?.message || error?.message
    })
  } finally {
    converting.value = false
  }
}

const getActions: TGetActions<TLead> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        goToLead(item)
      }
    },
    {
      ...actions.update,
      onSelect() {
        goToLead(item)
      }
    },
    {
      label: 'Convert to Deals',
      icon: 'i-lucide-repeat-2',
      onSelect() {
        convertLead(item)
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
  <BaseCrud
    ref="crudRef"
    get-url="/api/leads"
    :initial-query="{ boardItems: false }"
    delete-url="/api/leads/{id}"
    :show-add-button="false"
    :fields="[]"
    :columns="columns"
    :filters="leadListFilters"
    :get-actions="getActions"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        size="sm"
        label="Add Lead"
        color="primary"
        to="/leads/new"
      />
    </template>
  </BaseCrud>
</template>
