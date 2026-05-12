<script setup lang="ts">
defineProps<{
  task: TTask
}>()

const emit = defineEmits<{
  click: [task: TTask]
}>()
</script>

<template>
  <div
    class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors relative gap-1 flex flex-col"
    :class="[
      task.status === TaskStatus.TODO ? 'text-highlighted' : 'text-toned',
      task.id === Number($route.params.id)
        ? 'border-primary bg-primary/10'
        : 'border-bg hover:border-primary hover:bg-primary/5'
    ]"
    @click="emit('click', task)"
  >
    <h6 class="truncate">
      {{ task.name }}
    </h6>
    <p class="text-dimmed line-clamp-2">
      {{ task.description }}
    </p>
    <div class="flex gap-1">
      <TaskStatusBadge
        :size="'sm'"
        :status="task.status"
      />
      <TaskPriorityBadge
        :size="'sm'"
        :priority="task.priority"
      />
      <TaskDueDate
        :size="'sm'"
        :due-at="task.dueAt"
      />
    </div>
  </div>
</template>
