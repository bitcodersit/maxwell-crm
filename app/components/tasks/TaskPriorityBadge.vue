<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { capitalize } from 'vue'

defineProps<{
  size?: BadgeProps['size']
  priority: TTaskPriority
}>()
</script>

<template>
  <UBadge
    :size="size"
    :color="ColorsMap[priority]"
    variant="soft"
    class="cursor-pointer"
  >
    <UIcon name="i-lucide-flag" />
    {{ capitalize(priority.split('_').join(' ').toLowerCase()) }}
  </UBadge>
</template>
