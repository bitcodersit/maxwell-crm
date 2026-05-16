<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import type { TLead, TLeadStatus } from '~~/shared/types/Lead'

definePageMeta({ title: 'Leads' })

const crudRef = useTemplateRef('crudRef')
const { leads, init, refreshFromApi } = useLeadsStore()
const UBadge = resolveComponent('UBadge')

const viewMode = ref<'kanban' | 'list'>('kanban')
const search = ref('')
const drawerOpen = ref(false)
const editingLead = ref<TLead | null>(null)

onMounted(() => {
  init()
})

function openAddLead() {
  editingLead.value = null
  drawerOpen.value = true
}

function openEditLead(lead: TLead) {
  editingLead.value = lead
  drawerOpen.value = true
}

async function onLeadSaved() {
  await refreshFromApi()
  crudRef.value?.refetch?.()
}

const statusColorMap: Record<TLeadStatus, string> = {
  Hot: 'error',
  Warm: 'warning',
  Cold: 'info',
  'Not Interested': 'neutral',
  Closed: 'success'
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
        color: statusColorMap[row.original.status] || 'neutral',
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
  {
    accessorKey: 'followUpDate',
    header: 'Follow-up',
    sortBy: 'followUpDate',
    cell: ({ row }) => row.original.followUpDate || '—'
  },
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
  ].filter((action: { hidden?: boolean }) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

watch(viewMode, async mode => {
  if (mode === 'kanban') {
    await refreshFromApi()
  }
})
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="flex-1">
        <h2 class="text-xl font-semibold text-highlighted">Leads</h2>
        <p class="text-sm text-muted">{{ leads.length }} total leads</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <div class="flex items-center rounded-lg border border-default overflow-hidden">
          <button
            :class="[
              'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
              viewMode === 'kanban' ? 'bg-primary text-white' : 'text-muted hover:bg-elevated'
            ]"
            @click="viewMode = 'kanban'"
          >
            <UIcon name="i-lucide-kanban" class="size-4" />
            <span class="hidden sm:inline">Kanban</span>
          </button>
          <button
            :class="[
              'px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors',
              viewMode === 'list' ? 'bg-primary text-white' : 'text-muted hover:bg-elevated'
            ]"
            @click="viewMode = 'list'"
          >
            <UIcon name="i-lucide-table" class="size-4" />
            <span class="hidden sm:inline">List</span>
          </button>
        </div>
        <UInput
          v-if="viewMode === 'kanban'"
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search…"
          class="w-full sm:w-56"
          size="sm"
        />
        <UButton
          icon="i-lucide-plus"
          size="sm"
          label="Add Lead"
          @click="openAddLead"
        />
      </div>
    </div>

    <LeadKanban
      v-if="viewMode === 'kanban'"
      :search="search"
      @edit="openEditLead"
    />

    <BaseCrud
      v-else
      ref="crudRef"
      get-url="/api/leads"
      delete-url="/api/leads/{id}"
      :show-add-button="false"
      :fields="[]"
      :columns="columns"
      :filters="filters"
      :get-actions="getActions"
    />

    <LeadFormModal
      v-model:open="drawerOpen"
      :lead="editingLead"
      @saved="onLeadSaved"
    />
  </div>
</template>
