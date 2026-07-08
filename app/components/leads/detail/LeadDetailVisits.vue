<script setup lang="ts">
const props = defineProps<{
  visits: TPaginated<TVisit>
}>()

defineEmits<{
  refresh: []
}>()

const actions = useLeadDetailActions()
const items = computed(() => props.visits.data)

function assignees(visit: TVisit) {
  return (visit.assignable?.users ?? [])
    .map(u => u.user)
    .filter((u): u is NonNullable<typeof u> => !!u)
}
</script>

<template>
  <div class="pt-6 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p class="text-sm text-muted">
        {{ visits.total }} site visit{{ visits.total === 1 ? '' : 's' }}
      </p>
      <UButton
        icon="i-lucide-plus"
        label="Schedule visit"
        size="sm"
        @click="actions?.openVisitModal()"
      />
    </div>

    <LeadDetailEmptyState
      v-if="!items.length"
      icon="i-lucide-map-pin"
      title="No site visits yet"
      description="Record site visits to track customer presence and next actions."
    >
      <UButton
        class="mt-4"
        icon="i-lucide-plus"
        label="Schedule visit"
        size="sm"
        @click="actions?.openVisitModal()"
      />
    </LeadDetailEmptyState>

    <div
      v-else
      class="grid grid-cols-1 gap-4"
    >
      <UPageCard
        v-for="visit in items"
        :key="visit.id"
        variant="subtle"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div class="space-y-1">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-medium text-highlighted">
                {{ $dfc(visit.date, 'MMM d, yyyy h:mm a') }}
              </span>
              <UBadge
                :label="formatLeadStatus(visit.status)"
                :color="visitStatusColors[visit.status] || 'neutral'"
                variant="soft"
                size="sm"
              />
            </div>
            <p
              v-if="visit.author?.name"
              class="text-sm text-muted"
            >
              Logged by {{ visit.author.name }}
            </p>
          </div>
          <LeadDetailUserStack :users="assignees(visit)" />
        </div>

        <dl class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div v-if="visit.customerPresence">
            <dt class="text-muted">
              Customer presence
            </dt>
            <dd class="mt-0.5 font-medium text-highlighted">
              {{ visit.customerPresence }}
            </dd>
          </div>
          <div v-if="visit.checkIn">
            <dt class="text-muted">
              Check-in
            </dt>
            <dd class="mt-0.5">
              <UBadge
                :label="`${(visit.checkIn as { lat?: number }).lat}, ${(visit.checkIn as { lng?: number }).lng}`"
                color="neutral"
                variant="subtle"
                size="sm"
                icon="i-lucide-map-pin"
              />
            </dd>
          </div>
          <div
            v-if="visit.nextAction"
            class="sm:col-span-2"
          >
            <dt class="text-muted">
              Next action
            </dt>
            <dd class="mt-0.5 text-default">
              {{ visit.nextAction }}
            </dd>
          </div>
        </dl>
      </UPageCard>
    </div>
  </div>
</template>
