<script setup lang="ts">
import { capitalize } from 'vue'
import type { TargetFrequency } from '~~/prisma/client/client'

const props = withDefaults(
  defineProps<{
    frequency?: TargetFrequency | null
    rangeStart?: Date | string | null
    rangeEnd?: Date | string | null
    intervalDays?: number | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    size: 'md'
  }
)

const label = computed(() => {
  if (!props.frequency) return 'No recurrence'
  const freq = capitalize(props.frequency.toLowerCase())
  const custom =
    props.frequency === 'CUSTOM' && props.intervalDays ? ` every ${props.intervalDays}d` : ''
  const range =
    props.rangeStart && props.rangeEnd
      ? ` · ${$dfc(props.rangeStart, 'dd MMM')}–${$dfc(props.rangeEnd, 'dd MMM yyyy')}`
      : props.rangeEnd
        ? ` · due ${$dfc(props.rangeEnd, 'dd MMM yyyy')}`
        : ''
  return `${freq}${custom}${range}`
})
</script>

<template>
  <UBadge
    color="info"
    variant="subtle"
    :size="size"
    icon="i-lucide-repeat"
    :label="label"
  />
</template>
