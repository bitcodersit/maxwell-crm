<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { TargetStatus } from '~~/prisma/client/enums'
import { isPastTargetWindow } from '~~/shared/utils/targetWindows'

const props = defineProps<{
  startsAt?: Date | string | null
  dueAt?: Date | string | null
  status?: TargetStatus | null
  size?: BadgeProps['size']
}>()

const label = computed(() => {
  if (!props.startsAt && !props.dueAt) return 'No date range'
  if (props.startsAt && props.dueAt) {
    return `${$dfc(props.startsAt, 'dd MMM')}–${$dfc(props.dueAt, 'dd MMM yyyy')}`
  }
  return $dfc(props.dueAt || props.startsAt, 'dd MMM yyyy')
})

const color = computed(() => {
  if (props.status === TargetStatus.ACHIEVED) return 'neutral' as const
  if (isPastTargetWindow(props.dueAt)) return 'error' as const
  return 'primary' as const
})
</script>

<template>
  <UBadge
    :size="size"
    :color="color"
    variant="soft"
    class="cursor-pointer"
  >
    <UIcon name="i-lucide-calendar-range" />
    {{ label }}
  </UBadge>
</template>
