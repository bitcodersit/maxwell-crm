<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { capitalize } from 'vue'

defineProps<{
  status: TTaskStatus
  priority: TTaskPriority
  size?: BadgeProps['size']
}>()
</script>

<template>
  <UBadge
    :size="size"
    :color="status !== TaskStatus.COMPLETED ? ColorsMap[priority] : 'neutral'"
    :class="{ 'text-muted': status === TaskStatus.COMPLETED }"
    variant="soft"
    class="cursor-pointer"
    :aria-label="`Priority ${capitalize(priority.split('_').join(' ').toLowerCase())}`"
  >
    <UIcon name="i-lucide-flag" />
    {{ capitalize(priority.split('_').join(' ').toLowerCase()) }}
  </UBadge>
</template>
