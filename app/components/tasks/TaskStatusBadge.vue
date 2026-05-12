<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { capitalize } from 'vue'

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
    {{ capitalize(status.split('_').join(' ').toLowerCase()) }}
  </UBadge>
</template>
