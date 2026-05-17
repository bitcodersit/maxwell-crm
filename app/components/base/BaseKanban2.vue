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

const $fetch = useRequestFetch()
const { data, isFetching } = useQuerySSR({
  queryKey,
  queryFn: () => {
    return $fetch<TBoard>(`/api/boards/${props.boardName}`)
  }
})

const columns = shallowRef<TBoardColumn[]>([])

watch(
  data,
  newVal => {
    columns.value = [...(newVal?.columns || [])]
  },
  { immediate: true }
)

const { mutate: reorderColumn } = useMutation({
  mutationFn({
    columnId,
    ...body
  }: {
    columnId: number
    beforeSortOrder: TMaybe<string>
    afterSortOrder: TMaybe<string>
  }) {
    return $fetch<TBoardColumn>(`/api/boards/${props.boardName}/columns/${columnId}/reorder`, {
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
  }
})

const columnsRef = (el: Element | ComponentPublicInstance | null) => {
  if (!el) return
  useSortable(el as HTMLElement, columns, {
    animation: 150,
    watchElement: true,
    handle: '.base-kanban-handle',
    filter: '.base-kanban-pinned',
    direction: 'horizontal',
    onEnd: e => {
      const copy = [...columns.value]
      const movedColumn = copy[e.oldIndex!]

      copy.splice(e.oldIndex!, 1)
      copy.splice(e.newIndex!, 0, movedColumn!)

      const index = copy.indexOf(movedColumn!)

      reorderColumn({
        columnId: movedColumn!.id,
        beforeSortOrder: copy[index - 1]?.sortOrder,
        afterSortOrder: copy[index + 1]?.sortOrder
      })
    }
  })
}
</script>

<template>
  <div class="relative">
    <ClientOnly>
      <UProgress
        v-if="isFetching"
        :ui="{ base: 'rounded-none' }"
        size="sm"
        class="absolute top-0 left-0 w-full"
      />
    </ClientOnly>
    <div
      :ref="columnsRef"
      class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 py-4 flex gap-4 relative"
    >
      <div
        v-for="column in columns"
        :key="column.id"
        class="flex-none w-96 flex flex-col overflow-hidden border border-default rounded-lg"
        :class="{
          'base-kanban-pinned': column.pinned
        }"
      >
        <div class="flex-none bg-elevated">
          <div class="flex items-center gap-2 px-3 py-2">
            <button
              v-if="!column.pinned"
              type="button"
              class="base-kanban-handle shrink-0 p-0.5 rounded text-muted hover:text-highlighted hover:bg-default cursor-grab active:cursor-grabbing touch-none"
              aria-label="Drag column"
              @click.stop
            >
              <UIcon
                name="i-lucide-grip-vertical"
                class="size-4"
              />
            </button>
            <span class="text-sm font-semibold text-highlighted truncate"
              >{{ column.id }}.{{ column.sortOrder }} - {{ column.name }}
            </span>
            <UBadge
              :label="String(data?.items?.length || 0)"
              color="neutral"
              variant="soft"
              size="xs"
            />
          </div>
          <div
            class="h-1"
            :style="{
              backgroundColor: column.color ? column.color : 'var(--color-border)'
            }"
          ></div>
        </div>

        <!-- Items -->
        <div>
          <div class="text-center py-4 text-xs text-muted italic">No items</div>
        </div>
      </div>
    </div>
  </div>
</template>
