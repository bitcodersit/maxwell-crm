<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

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
    {{ priority }}
  </UBadge>
</template>
