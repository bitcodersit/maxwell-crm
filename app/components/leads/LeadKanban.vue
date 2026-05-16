<script setup lang="ts">
import type { TLead, TLeadStatus } from '~~/shared/types/Lead'
import { LEAD_STATUSES } from '@/composables/useLeadsStore'

const props = defineProps<{
  search?: string
}>()

const emit = defineEmits<{
  edit: [lead: TLead]
}>()

const { leads, loading, updateStatus } = useLeadsStore()
const today = new Date().toISOString().split('T')[0]

const statusColors: Record<TLeadStatus, string> = {
  Hot: 'border-red-400',
  Warm: 'border-amber-400',
  Cold: 'border-sky-400',
  'Not Interested': 'border-slate-400',
  Closed: 'border-emerald-500'
}

const statusBadge: Record<TLeadStatus, string> = {
  Hot: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  Warm: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Cold: 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
  'Not Interested': 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
  Closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
}

const sourceColors: Record<string, string> = {
  Facebook: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  Website: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  Phone: 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-300',
  Referral: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
  'Walk-in': 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300'
}

const draggingId = ref<number | null>(null)
const dragOverStatus = ref<TLeadStatus | null>(null)

const filteredByStatus = computed(() => {
  const q = (props.search || '').toLowerCase().trim()
  const filterLead = (lead: TLead) => {
    if (!q) return true
    return (
      lead.customerName.toLowerCase().includes(q) ||
      lead.phone.includes(q) ||
      lead.serialCode.toLowerCase().includes(q)
    )
  }

  return LEAD_STATUSES.reduce(
    (acc, status) => {
      acc[status] = leads.value.filter(l => l.status === status && filterLead(l))
      return acc
    },
    {} as Record<TLeadStatus, TLead[]>
  )
})

function isOverdue(date: string | null) {
  return !!date && date < today
}

function onDragStart(lead: TLead) {
  draggingId.value = lead.id
}

function onDragEnd() {
  draggingId.value = null
  dragOverStatus.value = null
}

function onDragOver(status: TLeadStatus, e: DragEvent) {
  e.preventDefault()
  dragOverStatus.value = status
}

async function onDrop(status: TLeadStatus) {
  const id = draggingId.value
  dragOverStatus.value = null
  draggingId.value = null
  if (!id) return
  const lead = leads.value.find(l => l.id === id)
  if (!lead || lead.status === status) return
  await updateStatus(id, status)
}
</script>

<template>
  <div
    v-if="loading"
    class="flex items-center justify-center py-16 text-muted text-sm"
  >
    <UIcon name="i-lucide-loader-circle" class="size-5 animate-spin mr-2" />
    Loading leads…
  </div>

  <div
    v-else
    class="flex-1 overflow-x-auto pb-4"
  >
    <div class="flex gap-4 min-w-max h-full items-start">
      <div
        v-for="status in LEAD_STATUSES"
        :key="status"
        class="w-64 flex-shrink-0 flex flex-col"
        @dragover="onDragOver(status, $event)"
        @drop="onDrop(status)"
      >
        <div
          :class="[
            'flex items-center justify-between px-3 py-2 rounded-t-lg border-t-4 bg-elevated',
            statusColors[status],
            dragOverStatus === status ? 'ring-2 ring-primary' : ''
          ]"
        >
          <span class="text-sm font-semibold text-highlighted">{{ status }}</span>
          <UBadge
            :label="String(filteredByStatus[status].length)"
            color="neutral"
            variant="soft"
            size="xs"
          />
        </div>

        <div
          class="flex flex-col gap-2 p-2 bg-elevated/40 rounded-b-lg border border-default border-t-0 min-h-32"
        >
          <div
            v-for="lead in filteredByStatus[status]"
            :key="lead.id"
            draggable="true"
            :class="[
              'bg-default rounded-lg border border-default p-3 shadow-xs hover:shadow-sm cursor-grab active:cursor-grabbing transition-shadow',
              draggingId === lead.id ? 'opacity-50' : ''
            ]"
            @dragstart="onDragStart(lead)"
            @dragend="onDragEnd"
            @click="emit('edit', lead)"
          >
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-mono text-muted">{{ lead.serialCode }}</span>
              <span :class="['text-xs font-medium px-1.5 py-0.5 rounded-full', statusBadge[lead.status]]">
                {{ lead.status }}
              </span>
            </div>

            <p class="text-sm font-semibold text-highlighted leading-tight">
              {{ lead.customerName }}
            </p>
            <p class="text-xs text-muted mt-0.5">{{ lead.phone }}</p>

            <div class="flex items-center gap-1.5 mt-2">
              <UIcon name="i-lucide-map-pin" class="size-3 text-muted flex-shrink-0" />
              <span class="text-xs text-muted truncate">
                {{ lead.area || '—' }} · {{ lead.budgetRange || '—' }}
              </span>
            </div>

            <div class="mt-2">
              <span
                :class="[
                  'text-xs px-1.5 py-0.5 rounded-md font-medium',
                  sourceColors[lead.source] || ''
                ]"
              >
                {{ lead.source }}
              </span>
            </div>

            <div class="flex items-center justify-between mt-3 pt-2 border-t border-default">
              <div class="flex items-center gap-1.5">
                <div class="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <span class="text-xs font-bold text-primary">
                    {{ (lead.assignedSalesman || '?')[0] }}
                  </span>
                </div>
                <span class="text-xs text-muted">{{ lead.assignedSalesman || 'Unassigned' }}</span>
              </div>
              <div
                :class="[
                  'flex items-center gap-1 text-xs',
                  isOverdue(lead.followUpDate) ? 'text-red-500 font-medium' : 'text-muted'
                ]"
              >
                <UIcon name="i-lucide-calendar" class="size-3" />
                {{ lead.followUpDate || '—' }}
              </div>
            </div>
          </div>

          <div
            v-if="!filteredByStatus[status].length"
            class="text-center py-4 text-xs text-muted italic"
          >
            No leads
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
