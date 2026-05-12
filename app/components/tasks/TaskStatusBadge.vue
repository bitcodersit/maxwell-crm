<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'

defineProps<{
  size?: BadgeProps['size']
  status: TTaskStatus
}>()
</script>

<template>
  <UBadge
    :size="size"
    :color="ColorsMap[status]"
    variant="soft"
    class="cursor-pointer"
  >
    <UIcon name="i-lucide-check-circle" />
    {{ status }}
  </UBadge>
</template>
