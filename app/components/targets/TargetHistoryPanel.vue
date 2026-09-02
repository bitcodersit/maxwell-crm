<script setup lang="ts">
const props = defineProps<{
  targetId: number
}>()

const { data, isFetching } = useTargetHistoryQuery(() => props.targetId, true)

const openCycle = (cycleId: number) => {
  navigateTo(`/targets/${cycleId}`)
}
</script>

<template>
  <div
    v-if="isFetching"
    class="flex justify-center py-8"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-6 animate-spin text-primary"
    />
  </div>
  <div
    v-else-if="!data?.length"
    class="text-sm text-muted py-6 text-center"
  >
    No past cycles yet. History appears after the next period is generated.
  </div>
  <div
    v-else
    class="space-y-3"
  >
    <button
      v-for="cycle in data"
      :key="cycle.id"
      type="button"
      class="w-full text-left rounded-lg border border-default p-3 hover:bg-elevated/50 transition-colors space-y-2"
      @click="openCycle(cycle.id)"
    >
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <div class="font-medium truncate">
            {{
              cycle.startsAt && cycle.dueAt
                ? `${$dfc(cycle.startsAt, 'dd MMM')}–${$dfc(cycle.dueAt, 'dd MMM yyyy')}`
                : cycle.dueAt
                  ? $dfc(cycle.dueAt, 'dd MMM yyyy')
                  : '—'
            }}
          </div>
          <div class="text-xs text-muted mt-0.5">
            {{ cycle.completedItems }} / {{ cycle.totalItems }} items completed
          </div>
        </div>
        <UBadge
          :color="cycle.isFilledUp ? 'success' : cycle.fillUpPercent > 0 ? 'warning' : 'neutral'"
          variant="subtle"
          :label="cycle.isFilledUp ? 'Filled up' : `${cycle.fillUpPercent}%`"
        />
      </div>
      <UProgress
        :model-value="cycle.fillUpPercent"
        :color="cycle.isFilledUp ? 'success' : 'primary'"
        size="xs"
      />
      <div class="flex items-center gap-2">
        <TargetStatusBadge
          size="sm"
          :status="cycle.targetStatus || cycle.status"
        />
      </div>
    </button>
  </div>
</template>
