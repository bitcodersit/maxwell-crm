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

const columns = computed<TColumn<TLead>[]>(() => [
  { id: 'select', size: 48 },
  {
    accessorKey: 'serialCode',
    header: 'Lead ID',
    pinned: 'left',
    sortBy: 'serialCode',
    size: 100
  },
  {
    accessorKey: 'customerName',
    header: 'Customer',
    sortBy: 'customerName'
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    sortBy: 'phone'
  },
  {
    accessorKey: 'source',
    header: 'Source',
    sortBy: 'source'
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortBy: 'status',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.status,
        color: ColorsMap[row.original.status] || 'neutral',
        variant: 'soft',
        size: 'sm'
      })
  },
  {
    accessorKey: 'propertyTypeMain',
    header: 'Property',
    cell: ({ row }) => `${row.original.propertyTypeMain} · ${row.original.propertyTypeSub}`
  },
  { accessorKey: 'budgetRange', header: 'Budget', sortBy: 'budgetRange' },
  { accessorKey: 'assignedSalesman', header: 'Salesman', sortBy: 'assignedSalesman' },
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
    props: { placeholder: 'Search name, phone or ID…' }
  },
  {
    name: 'status',
    type: 'input',
    props: { label: 'Status', placeholder: 'Hot, Warm, Cold…' }
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
