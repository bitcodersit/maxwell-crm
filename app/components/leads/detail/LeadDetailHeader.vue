<script setup lang="ts">
const props = defineProps<{
  lead: TLead
}>()

const actions = useLeadDetailActions()

const statusLabel = computed(() => formatLeadStatus(props.lead.status))
const statusColor = computed(() => leadStatusColors[props.lead.status] || 'neutral')
const budget = computed(() => formatBudgetRange(props.lead.budgetMin, props.lead.budgetMax))
const propertyLabel = computed(() => {
  const main = props.lead.propertyTypeMain?.name
  const sub = props.lead.propertyTypeSub?.name
  if (!main && !sub) return null
  return [main, sub].filter(Boolean).join(' · ')
})
</script>

<template>
  <div class="space-y-4 border-b border-default pb-6">
    <UButton
      icon="i-lucide-chevron-left"
      color="neutral"
      variant="link"
      label="Back to leads"
      class="flex-none -ml-1 p-0"
      to="/leads"
    />

    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2 min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ lead.sid }}
          </h1>
          <UBadge
            :label="statusLabel"
            :color="statusColor"
            variant="soft"
            size="md"
          />
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span
            v-if="lead.customer?.name"
            class="font-medium text-highlighted"
          >
            {{ lead.customer.name }}
          </span>
          <a
            v-if="lead.customer?.phone"
            :href="`tel:${lead.customer.phone}`"
            class="inline-flex items-center gap-1 hover:text-primary transition-colors"
          >
            <UIcon
              name="i-lucide-phone"
              class="size-3.5"
            />
            {{ lead.customer.phone }}
          </a>
        </div>
        <div class="flex flex-wrap gap-2 pt-1">
          <UBadge
            v-if="lead.source?.name"
            :label="lead.source.name"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-if="propertyLabel"
            :label="propertyLabel"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UBadge
            v-if="budget !== '—'"
            :label="budget"
            color="neutral"
            variant="subtle"
            size="sm"
          />
          <UBadge
            :label="`Created ${$dfc(lead.createdAt, 'MMM d, yyyy')}`"
            color="neutral"
            variant="subtle"
            size="sm"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0">
        <UButton
          icon="i-lucide-pencil"
          label="Edit"
          color="neutral"
          variant="outline"
          @click="actions?.openEditModal()"
        />
      </div>
    </div>
  </div>
</template>
