<script lang="ts">
import type { SortableEvent } from 'sortablejs'
import { useSortable } from '@vueuse/integrations/useSortable'
</script>

<script setup lang="ts" generic="Item extends Record<string, any>">
const props = defineProps<{
  boardId: number
  columnId: number
  getItem: (v: TBoardItem) => Item
}>()

const queryKey = computed(() => {
  return [
    `/api/board-items`,
    {
      boardId: props.boardId,
      columnId: props.columnId
    }
  ] as const
})

const { data, isFetched, isFetching } = useQuery({
  queryKey,
  queryFn: ({ queryKey: [api, query] }) => {
    return $fetch<TPaginated<TBoardItem>>(api, {
      query
    })
  },
  initialData: () => {
    return toPaginated<TBoardItem>([])
  }
})

const items = shallowRef<TBoardItem[]>([])
watch(
  data,
  newVal => {
    items.value = [...(newVal.data || [])]
  },
  {
    deep: true,
    immediate: true
  }
)

const emit = defineEmits<{
  refetch: []
}>()

const parseSortableEvent = (e: SortableEvent) => {
  return {
    id: Number(e.target.children[e.newIndex!]?.getAttribute('data-item-id')),
    sortOrder: [
      e.target.children[e.newIndex! - 1]?.getAttribute('data-item-sort-order') ?? null,
      e.target.children[e.newIndex! + 1]?.getAttribute('data-item-sort-order') ?? null
    ]
  }
}

const itemsSortableReady = ref(false)
const itemsRef = (el: Element | ComponentPublicInstance | null) => {
  if (!el || itemsSortableReady.value) return
  itemsSortableReady.value = true
  useSortable(el as HTMLElement, items, {
    animation: 150,
    group: 'base-kanban-items',
    onAdd(e) {
      const { id, sortOrder } = parseSortableEvent(e)
      $fetch<TBoardItem>(`/api/board-items/${id}`, {
        method: 'PATCH',
        body: {
          sortOrder,
          columnId: props.columnId
        }
      }).then(() => {
        emit('refetch')
      })
    },
    onUpdate: e => {
      if (e.oldIndex === e.newIndex) return
      const { id, sortOrder } = parseSortableEvent(e)
      $fetch<TBoardItem>(`/api/board-items/${id}`, {
        method: 'PATCH',
        body: { sortOrder }
      })
    }
  })
}
</script>

<template>
  <ClientOnly>
    <div
      :ref="itemsRef"
      class="overflow-y-auto scrollbar border-x border-b border-default rounded-b-lg bg-default p-2 flex flex-col gap-2 relative"
    >
      <UProgress
        v-if="isFetching"
        :ui="{ base: 'rounded-none' }"
        size="sm"
        class="absolute top-px left-0 w-full"
      />
      <div
        v-for="(item, index) in items"
        :key="item.id"
        :data-item-id="item.id"
        :data-item-sort-order="item.sortOrder"
      >
        <slot
          name="item"
          :item="getItem(item)"
          :index="index"
        />
      </div>
      <div
        v-if="isFetched && !items.length"
        class="text-center text-muted text-sm italic py-8"
      >
        No items
      </div>
    </div>
  </ClientOnly>
</template>
