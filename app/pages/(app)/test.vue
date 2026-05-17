<script setup lang="ts">
definePageMeta({
  title: 'Kanban Test',
  layout: {
    name: 'default',
    props: {
      padding: false
    }
  }
})

const getItem = (item: TBoardItem) => {
  return item?.task as TTask
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="flex items-center gap-2 flex-wrap px-4 pt-4">
      <h2 class="text-xl font-semibold text-highlighted">Kanban</h2>
    </div>
    <BaseKanban2
      :get-item="getItem"
      :board-name="'tasks-default'"
    >
      <template #item="{ item }">
        <div class="border-default py-4 bg-elevated/50 rounded-lg">
          <div class="px-4">
            <div class="truncate">
              {{ item.name }}
            </div>
            <div class="line-clamp-2 text-sm text-muted">
              {{ item.description }}
            </div>
            <div class="flex flex-wrap items-center gap-1 mt-2">
              <TaskStatusBadge :task="item" />
              <TaskPriorityBadge
                :status="item.status"
                :priority="item.priority"
              />
              <TaskDueDateBadge
                :due-at="item.dueAt"
                :status="item.status"
              />
            </div>
          </div>
        </div>
      </template>
    </BaseKanban2>
  </div>
</template>
