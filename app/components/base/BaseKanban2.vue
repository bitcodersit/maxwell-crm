<script lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
</script>

<script setup lang="ts" generic="Item extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    boardName: string
    getItem: (v: TBoardItem) => Item
  }>(),
  {
    //
  }
)

const queryKey = computed(() => {
  return [props.boardName]
})

const { data, isFetching } = useQuery({
  queryKey,
  queryFn: () => {
    return $fetch<TBoard>(`/api/boards/${props.boardName}`)
  }
})

const toast = useToast()

// Columns
const columns = shallowRef<TBoardColumn[]>([])

const { mutate: reorderColumn } = useMutation({
  mutationFn({ id, ...body }: { id: number; a: TMaybe<string>; b: TMaybe<string> }) {
    return $fetch<TBoardColumn>(`/api/boards/${props.boardName}/columns/${id}/reorder`, {
      body,
      method: 'PATCH'
    })
  },
  onSuccess(data) {
    columns.value = columns.value.map(column => {
      if (column.id === data.id) {
        return { ...column, ...data }
      }
      return column
    })
  },
  onError(error) {
    toast.add({
      title: 'Error',
      color: 'error',
      description: error.message
    })
  }
})

const columnsSortableReady = ref(false)
const columnsRef = (el: Element | ComponentPublicInstance | null) => {
  if (!el || columnsSortableReady.value) return
  columnsSortableReady.value = true
  useSortable(el as HTMLElement, columns, {
    animation: 150,
    // watchElement: true,
    handle: '.base-kanban-handle',
    filter: '.base-kanban-pinned',
    direction: 'horizontal',
    onEnd: e => {
      if (e.oldIndex === e.newIndex) return

      const copy = [...columns.value]
      const movedColumn = copy[e.oldIndex!]

      copy.splice(e.oldIndex!, 1)
      copy.splice(e.newIndex!, 0, movedColumn!)

      const index = copy.indexOf(movedColumn!)

      reorderColumn({
        id: movedColumn!.id,
        a: copy[index - 1]?.sortOrder,
        b: copy[index + 1]?.sortOrder
      })
    }
  })
}

watch(
  data,
  newVal => {
    console.log('onDataChange', newVal)
    columns.value = [...(newVal?.columns || [])]
  },
  {
    deep: true,
    immediate: true
  }
)

// Items
//
</script>

<template>
  <ClientOnly>
    <div class="relative">
      <UProgress
        v-if="isFetching"
        :ui="{ base: 'rounded-none' }"
        size="sm"
        class="absolute top-0 left-0 w-full"
      />
    </div>
    <div
      :ref="columnsRef"
      class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 py-4 flex gap-4 relative"
    >
      <div
        v-for="column in columns"
        :key="column.id"
        :class="{
          'base-kanban-pinned': column.pinned
        }"
        class="flex-none w-96 flex flex-col overflow-hidden rounded-lg"
      >
        <div class="flex-none bg-elevated">
          <div class="flex">
            <button
              v-if="!column.pinned"
              type="button"
              class="base-kanban-handle cursor-grab active:cursor-grabbing flex items-center justify-center px-2"
              @click.stop
            >
              <UIcon
                name="i-lucide-grip-vertical"
                class="size-4"
              />
            </button>
            <div class="flex items-center gap-2 py-2 pl-1 pr-3">
              <div class="text-sm font-semibold text-highlighted truncate">{{ column.name }}</div>
              <UBadge
                :label="String(data?.items?.length || 0)"
                size="sm"
                color="neutral"
                variant="subtle"
              />
            </div>
          </div>
          <div
            class="h-1 opacity-50"
            :style="{
              backgroundColor: column.color ? column.color : 'var(--color-border)'
            }"
          ></div>
        </div>
        <BaseKanbanItems
          v-if="data?.id"
          :board-id="data?.id"
          :column-id="column.id"
          :get-item="getItem"
        >
          <template #item="attrs">
            <slot
              name="item"
              v-bind="attrs"
            />
          </template>
        </BaseKanbanItems>
      </div>
    </div>
  </ClientOnly>
</template>
