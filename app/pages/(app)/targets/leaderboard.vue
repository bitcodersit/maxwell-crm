<script setup lang="ts">
import { format } from 'date-fns'
import { getWeeklyWindow, getMonthlyWindow } from '~~/shared/utils/targetWindows'

definePageMeta({
  title: 'Target leaderboard'
})

const { getAttachment } = useGetAttachment()

const period = ref<'week' | 'month' | 'custom'>('month')
const group = ref<'users' | 'teams'>('users')
const customFrom = ref<Date | null>(null)
const customTo = ref<Date | null>(null)

const periodItems = [
  { label: 'This week', value: 'week' },
  { label: 'This month', value: 'month' },
  { label: 'Custom', value: 'custom' }
]

const groupItems = [
  { label: 'Users', value: 'users' },
  { label: 'Teams', value: 'teams' }
]

const query = computed(() => {
  const next: Record<string, any> = {
    period: period.value,
    group: group.value
  }
  if (period.value === 'custom') {
    if (customFrom.value) next.from = format(customFrom.value, 'yyyy-MM-dd')
    if (customTo.value) next.to = format(customTo.value, 'yyyy-MM-dd')
  }
  return next
})

const { data, isFetching } = useTargetsLeaderboardQuery(query)

const rangeLabel = computed(() => {
  if (period.value === 'week') {
    const week = getWeeklyWindow(new Date())
    return `${$dfc(week.rangeStart, 'dd MMM')}–${$dfc(week.rangeEnd, 'dd MMM yyyy')}`
  }
  if (period.value === 'month') {
    const month = getMonthlyWindow(new Date())
    return `${$dfc(month.rangeStart, 'dd MMM')}–${$dfc(month.rangeEnd, 'dd MMM yyyy')}`
  }
  return data.value.rangeStart && data.value.rangeEnd
    ? `${$dfc(data.value.rangeStart, 'dd MMM')}–${$dfc(data.value.rangeEnd, 'dd MMM yyyy')}`
    : 'Custom range'
})
</script>

<template>
  <div class="space-y-4 p-4 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="link"
          label="Back to targets"
          class="-ml-2"
          to="/targets"
        />
        <h1 class="text-2xl font-semibold">Target leaderboard</h1>
        <p class="text-sm text-muted">{{ rangeLabel }}</p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <UTabs
          v-model="group"
          :items="groupItems"
          size="xs"
          variant="pill"
          :content="false"
        />
        <UTabs
          v-model="period"
          :items="periodItems"
          size="xs"
          variant="pill"
          :content="false"
        />
      </div>
    </div>

    <div
      v-if="period === 'custom'"
      class="flex flex-wrap items-end gap-3"
    >
      <UFormField label="From">
        <FormDate v-model="customFrom" />
      </UFormField>
      <UFormField label="To">
        <FormDate v-model="customTo" />
      </UFormField>
    </div>

    <UCard class="relative">
      <UProgress
        v-if="isFetching"
        size="sm"
        class="absolute top-0 left-0 w-full"
        :ui="{ base: 'rounded-none' }"
      />
      <div
        v-if="!data.data.length"
        class="text-sm text-muted py-10 text-center"
      >
        No performance data for this period.
      </div>
      <div
        v-else
        class="overflow-x-auto"
      >
        <table class="w-full text-sm">
          <thead class="text-left text-muted">
            <tr class="border-b border-default">
              <th class="py-2 pr-3 font-medium">Rank</th>
              <th class="py-2 pr-3 font-medium">{{ group === 'teams' ? 'Team' : 'User' }}</th>
              <th class="py-2 pr-3 font-medium">Assigned</th>
              <th class="py-2 pr-3 font-medium">Achieved</th>
              <th class="py-2 pr-3 font-medium">Missed</th>
              <th class="py-2 pr-3 font-medium">Skipped</th>
              <th class="py-2 pr-3 font-medium">Hit rate</th>
              <th class="py-2 font-medium">Avg fill-up</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in data.data"
              :key="`${row.userId || row.teamId}-${row.rank}`"
              class="border-b border-default/70"
            >
              <td class="py-3 pr-3 font-semibold">{{ row.rank }}</td>
              <td class="py-3 pr-3">
                <div class="flex items-center gap-2">
                  <UAvatar
                    v-if="group === 'users'"
                    size="xs"
                    :src="getAttachment(row.avatar?.path)"
                    :alt="row.name"
                  />
                  <span class="font-medium">{{ row.name }}</span>
                </div>
              </td>
              <td class="py-3 pr-3">{{ row.assigned }}</td>
              <td class="py-3 pr-3">{{ row.achieved }}</td>
              <td class="py-3 pr-3">{{ row.missed }}</td>
              <td class="py-3 pr-3">{{ row.skipped }}</td>
              <td class="py-3 pr-3">
                <UBadge
                  variant="soft"
                  :color="row.hitRate >= 70 ? 'success' : row.hitRate >= 40 ? 'warning' : 'error'"
                  :label="`${row.hitRate}%`"
                />
              </td>
              <td class="py-3">{{ row.fillUpPercent }}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>
  </div>
</template>
