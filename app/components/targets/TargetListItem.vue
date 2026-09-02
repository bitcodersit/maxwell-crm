<script setup lang="ts">
import { TargetStatus } from '~~/prisma/client/enums'
import { getTargetFillUp } from '~~/shared/utils/targetWindows'

defineProps<{
  target: TTask
}>()

const emit = defineEmits<{
  click: [target: TTask]
}>()

const fillUp = (target: TTask) => getTargetFillUp(target.items)
</script>

<template>
  <div
    class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors relative gap-1 flex flex-col"
    :class="[
      target.targetStatus === TargetStatus.RUNNING ? 'text-highlighted' : 'text-toned',
      target.id === Number($route.params.id)
        ? 'border-primary bg-primary/10'
        : 'border-bg hover:border-primary hover:bg-primary/5'
    ]"
    @click="emit('click', target)"
  >
    <h6 class="truncate">
      {{ target.name }}
    </h6>
    <p class="text-dimmed line-clamp-2">
      {{ target.description }}
    </p>
    <div class="flex flex-wrap gap-1">
      <TargetStatusBadge
        size="sm"
        :status="target.targetStatus"
      />
      <TaskPriorityBadge
        :size="'sm'"
        :status="
          target.targetStatus === TargetStatus.ACHIEVED ? TaskStatus.COMPLETED : TaskStatus.TODO
        "
        :priority="target.priority"
      />
      <TargetRangeBadge
        :size="'sm'"
        :starts-at="target.startsAt"
        :due-at="target.dueAt"
        :status="target.targetStatus"
      />
      <UBadge
        v-if="fillUp(target).totalItems"
        size="sm"
        variant="subtle"
        :color="fillUp(target).isFilledUp ? 'success' : 'neutral'"
        :label="`${fillUp(target).completedItems}/${fillUp(target).totalItems}`"
      />
    </div>
  </div>
</template>
