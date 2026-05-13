<script setup lang="ts">
import type { BadgeProps } from '@nuxt/ui'
import { capitalize } from 'vue'

const props = defineProps<{
  task: TTask
  size?: BadgeProps['size']
}>()

const terminalStatuses: TTaskStatus[] = [TaskStatus.FAILED, TaskStatus.COMPLETED, TaskStatus.CANCELLED]

const tooltipText = computed(() => {
  const t = props.task
  if (terminalStatuses.includes(t.status)) {
    return [
      t.reviewer?.name ? `Reviewed by ${t.reviewer.name}` : '',
      $dfc(t.reviewedAt, 'dd MMM yyyy hh:mm a', 'No review date')
    ]
      .filter(Boolean)
      .join(' at ')
  }
  return [
    t.submitter?.name ? `Submitted by ${t.submitter.name}` : '',
    $dfc(t.submittedAt, 'dd MMM yyyy hh:mm a', 'No submit date')
  ]
    .filter(Boolean)
    .join(' at ')
})

const label = computed(() =>
  capitalize(props.task.status.split('_').join(' ').toLowerCase())
)
</script>

<template>
  <UTooltip
    :delay-duration="0"
    :text="tooltipText"
  >
    <UBadge
      :size="size"
      :color="ColorsMap[task.status]"
      variant="soft"
      class="cursor-pointer"
    >
      <UIcon name="i-lucide-check-circle" />
      {{ label }}
    </UBadge>
  </UTooltip>
</template>
