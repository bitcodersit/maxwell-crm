<script setup lang="ts">
import type { TBoardDetail, TPaginated, TTask } from '~~/shared/types'

definePageMeta({
  title: 'Kanban Test'
})

const toast = useToast()

const loading = ref(true)
const syncing = ref(false)
const movingItemId = ref<number | null>(null)
const search = ref('')

const board = ref<TBoardDetail | null>(null)
const tasks = ref<TTask[]>([])

const formatStatus = (value: string) => {
  return value
    .toLowerCase()
    .split('_')
    .map(v => v.charAt(0).toUpperCase() + v.slice(1))
    .join(' ')
}

const fetchBoard = async () => {
  board.value = await $fetch<TBoardDetail>('/api/boards/by-slug/tasks/default')
}

const fetchTasks = async () => {
  const data = await $fetch<TPaginated<TTask>>('/api/tasks', {
    query: {
      perPage: 500,
      orderBy: {
        id: 'desc'
      }
    }
  })
  tasks.value = data.data || []
}

const syncMissingTasks = async (showToast = true) => {
  if (!board.value) return
  syncing.value = true

  const taskIds = new Set(tasks.value.map(task => task.id))
  const itemTaskIds = new Set(board.value.items.map(item => item.taskId).filter(Boolean))
  const missing = [...taskIds].filter(id => !itemTaskIds.has(id))

  for (const taskId of missing) {
    await $fetch(`/api/boards/${board.value.id}/items`, {
      method: 'POST',
      body: { taskId }
    })
  }

  if (missing.length) {
    await fetchBoard()
  }

  if (showToast) {
    toast.add({
      color: 'success',
      title: 'Board synced',
      description: missing.length
        ? `${missing.length} task(s) added to kanban board`
        : 'No missing task found'
    })
  }
  syncing.value = false
}

const refresh = async () => {
  loading.value = true
  await Promise.all([fetchBoard(), fetchTasks()])
  await syncMissingTasks(false)
  loading.value = false
}

const taskMap = computed(() => {
  return new Map(tasks.value.map(task => [task.id, task]))
})

const columns = computed(() => board.value?.columns || [])

const items = computed(() => {
  if (!board.value) return []
  const q = search.value.trim().toLowerCase()
  return board.value.items
    .filter(item => !!item.taskId)
    .map(item => {
      const task = taskMap.value.get(item.taskId!)
      if (!task) return null
      return {
        ...item,
        task,
        name: task.name
      }
    })
    .filter((item): item is NonNullable<typeof item> => {
      if (!item) return false
      if (!q) return true
      return item.task.name.toLowerCase().includes(q) || `${item.task.id}`.includes(q)
    })
})

const onMoveItem = async (payload: {
  itemId: number
  columnId: number
  beforeItemId?: number
  afterItemId?: number
}) => {
  if (!board.value) return

  movingItemId.value = payload.itemId
  await $fetch(`/api/boards/${board.value.id}/items/${payload.itemId}/move`, {
    method: 'PATCH',
    body: {
      columnId: payload.columnId,
      beforeItemId: payload.beforeItemId,
      afterItemId: payload.afterItemId
    }
  })
  await fetchBoard()
  movingItemId.value = null
}

const onColumnReorder = async (payload: {
  columnId: number
  beforeColumnId?: number
  afterColumnId?: number
}) => {
  if (!board.value) return

  await $fetch(`/api/boards/${board.value.id}/columns/${payload.columnId}/reorder`, {
    method: 'PATCH',
    body: {
      beforeColumnId: payload.beforeColumnId,
      afterColumnId: payload.afterColumnId
    }
  })
  await fetchBoard()
}

onMounted(refresh)
</script>

<template>
  <div class="flex flex-col h-full gap-4">
    <div class="flex items-center gap-2 flex-wrap">
      <h2 class="text-xl font-semibold text-highlighted">Kanban Test (Tasks)</h2>
      <UBadge
        v-if="board"
        color="neutral"
        variant="soft"
        :label="`${items.length} cards`"
      />
      <div class="ml-auto flex items-center gap-2 flex-wrap">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search task by name or id..."
          class="w-64"
          size="sm"
        />
        <UButton
          icon="i-lucide-refresh-cw"
          label="Refresh"
          color="neutral"
          variant="soft"
          :loading="loading"
          @click="refresh"
        />
        <UButton
          icon="i-lucide-rows-4"
          label="Sync Missing Tasks"
          :loading="syncing"
          @click="syncMissingTasks()"
        />
      </div>
    </div>

    <UAlert
      color="warning"
      variant="soft"
      title="Test Surface"
      description="This page is temporary for validating BaseKanban behavior with task placements."
    />

    <BaseKanban
      :columns="columns"
      :items="items"
      :loading="loading"
      @item-move="onMoveItem"
      @column-reorder="onColumnReorder"
      @item-click="(item: any) => navigateTo(`/tasks/${item.task.id}`)"
    >
      <template #column-header="{ column, count }">
        <div class="flex items-center justify-between w-full gap-2">
          <span class="text-sm font-semibold text-highlighted">
            #{{ column.id }} - {{ formatStatus(column.name) }}
          </span>
          <UBadge
            :label="String(count)"
            color="neutral"
            variant="soft"
            size="xs"
          />
        </div>
      </template>

      <template #item="{ item }">
        <div class="space-y-2">
          <div class="flex items-start justify-between gap-2">
            <p class="text-sm font-semibold text-highlighted line-clamp-2">
              {{ item.task.name }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-1">
            <TaskStatusBadge :task="item.task" />
            <TaskPriorityBadge
              :status="item.task.status"
              :priority="item.task.priority"
            />
            <TaskDueDateBadge
              :due-at="item.task.dueAt"
              :status="item.task.status"
            />
          </div>

          <div class="flex items-center justify-between text-xs text-muted">
            <span>{{ formatStatus(item.task.priority) }}</span>
            <span>{{ item.task.dueAt ? $dfc(item.task.dueAt) : 'No due date' }}</span>
          </div>

          <div
            v-if="movingItemId === item.id"
            class="text-[11px] text-primary"
          >
            Saving move...
          </div>
        </div>
      </template>
    </BaseKanban>
  </div>
</template>
