<script setup lang="ts">
import type { TLead } from '~~/shared/types/Lead'
import {
  formatBudgetRange,
  formatLeadStatus,
  leadStatusColors
} from '@/utils/leads'

const props = defineProps<{
  lead: TLead
}>()

const statusColor = computed(() => leadStatusColors[props.lead.status] || 'neutral')
const statusLabel = computed(() => formatLeadStatus(props.lead.status))

const customerName = computed(() => props.lead.customer?.name || '')
const customerPhone = computed(() => props.lead.customer?.phone || null)

const area = computed(() => {
  return (
    props.lead.address?.name ||
    props.lead.address?.addressLine1 ||
    props.lead.address?.block ||
    null
  )
})

const budget = computed(() => formatBudgetRange(props.lead.budgetMin, props.lead.budgetMax))

const propertyType = computed(() => {
  const main = props.lead.propertyTypeMain?.name
  const sub = props.lead.propertyTypeSub?.name
  if (!main && !sub) return null
  return [main, sub].filter(Boolean).join(' · ')
})

const salesman = computed(() => {
  const users = props.lead.assignable?.users ?? []
  const names = users.map(row => row.user?.name).filter(Boolean) as string[]
  if (!names.length) return null
  if (names.length === 1) return names[0]
  return `${names[0]} +${names.length - 1}`
})

const borderClass = computed(() => {
  const map: Record<string, string> = {
    primary: 'border-l-primary',
    error: 'border-l-error',
    warning: 'border-l-warning',
    secondary: 'border-l-secondary',
    neutral: 'border-l-muted',
    success: 'border-l-success'
  }
  return map[statusColor.value] || 'border-l-muted'
})
</script>

<template>
  <NuxtLink
    :to="`/leads/${lead.sid}`"
    class="block rounded-lg border border-default border-l-4 bg-default p-3 shadow-xs hover:shadow-sm hover:border-primary/40 transition-all"
    :class="borderClass"
  >
    <div class="flex items-start justify-between gap-2 mb-2">
      <span class="text-xs font-mono text-muted truncate">{{ lead.sid }}</span>
      <UBadge
        :label="statusLabel"
        :color="statusColor"
        variant="soft"
        size="xs"
        class="shrink-0"
      />
    </div>

    <p
      v-if="customerName"
      class="text-sm font-semibold text-highlighted leading-tight truncate"
    >
      {{ customerName }}
    </p>
    <p
      v-if="customerPhone"
      class="text-xs text-muted mt-0.5 flex items-center gap-1"
    >
      <UIcon
        name="i-lucide-phone"
        class="size-3 shrink-0"
      />
      <span class="truncate">{{ customerPhone }}</span>
    </p>

    <div
      v-if="area || budget !== '—'"
      class="flex items-center gap-1.5 mt-2 text-xs text-muted"
    >
      <UIcon
        name="i-lucide-map-pin"
        class="size-3 shrink-0"
      />
      <span class="truncate">
        <template v-if="area">{{ area }}</template>
        <template v-if="area && budget !== '—'"> · </template>
        <template v-if="budget !== '—'">{{ budget }}</template>
      </span>
    </div>

    <div
      v-if="propertyType || lead.source?.name"
      class="flex flex-wrap items-center gap-1.5 mt-2"
    >
      <UBadge
        v-if="lead.source?.name"
        :label="lead.source.name"
        color="neutral"
        variant="subtle"
        size="xs"
      />
      <UBadge
        v-if="propertyType"
        :label="propertyType"
        color="neutral"
        variant="subtle"
        size="xs"
      />
    </div>

    <div class="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-default">
      <div class="flex items-center gap-1.5 min-w-0">
        <UIcon
          name="i-lucide-user"
          class="size-3.5 text-muted shrink-0"
        />
        <span class="text-xs text-muted truncate">
          {{ salesman || 'Unassigned' }}
        </span>
      </div>
      <div
        class="flex items-center gap-1 text-xs text-muted shrink-0"
        :title="`Updated ${$dfc(lead.updatedAt)}`"
      >
        <UIcon
          name="i-lucide-clock"
          class="size-3"
        />
        {{ $dfc(lead.updatedAt, 'MMM d, yyyy') }}
      </div>
    </div>
  </NuxtLink>
</template>
