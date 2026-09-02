<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { capitalize } from 'vue'
import { TargetStatus } from '~~/prisma/client/enums'

const props = defineProps<{
  status?: TargetStatus | null
  size?: BadgeProps['size']
}>()

const label = computed(() =>
  props.status ? capitalize(props.status.split('_').join(' ').toLowerCase()) : '—'
)
</script>

<template>
  <UBadge
    :size="size"
    :color="status ? ColorsMap[status] : 'neutral'"
    variant="soft"
    class="cursor-pointer"
  >
    <UIcon name="i-lucide-target" />
    {{ label }}
  </UBadge>
</template>
