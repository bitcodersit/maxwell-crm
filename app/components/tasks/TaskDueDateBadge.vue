<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { differenceInCalendarDays, isToday } from 'date-fns'

const props = defineProps<{
  dueAt: TTask['dueAt']
  size?: BadgeProps['size']
}>()

const daysLeft = computed(() => {
  if (!props.dueAt) {
    return {
      text: 'No due date',
      color: 'neutral' as const
    }
  }

  const dueDate = new Date(props.dueAt)
  const diff = differenceInCalendarDays(dueDate, new Date())

  if (isToday(dueDate)) {
    return {
      text: 'Due today',
      color: 'error' as const
    }
  }

  if (diff > 0) {
    return {
      text: `${diff} day${diff === 1 ? '' : 's'} left`,
      color: diff < 7 ? ('warning' as const) : ('success' as const)
    }
  }

  const overdue = Math.abs(diff)
  return {
    text: `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`,
    color: 'error' as const
  }
})
</script>

<template>
  <UChip
    :show="!dueAt"
    :size="size"
    class="cursor-pointer"
  >
    <UBadge
      :size="size"
      :color="dueAt ? daysLeft.color : 'neutral'"
      variant="soft"
    >
      <UIcon name="i-lucide-calendar" />
      <template v-if="dueAt"> {{ $dfc(dueAt, 'dd MMM yyyy') }} • {{ daysLeft.text }} </template>
      <span
        v-else
        class="italic"
      >
        No due date
      </span>
    </UBadge>
  </UChip>
</template>
