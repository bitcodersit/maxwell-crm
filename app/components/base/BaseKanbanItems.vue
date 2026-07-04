<script lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
</script>

<script setup lang="ts" generic="Item extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    columnId: number
    getItem: (v: TBoardItem) => Item
    itemsQuery?: Record<string, any>
  }>(),
  {
    itemsQuery: () => ({})
  }
)

const queryKey = computed(() => {
  return [
    `/api/board-items`,
    {
      columnId: props.columnId,
      ...props.itemsQuery
    }
  ] as const
})

const { data, isFetched, isFetching, fetchNextPage, isFetchingNextPage } = useInfiniteQuery({
  queryKey,
  initialPageParam: 1,
  queryFn: ({ queryKey: [api, query], pageParam }) => {
    return $fetch<TPaginated<TBoardItem>>(api, {
      query: {
        ...query,
        page: pageParam
      }
    })
  },
  getPreviousPageParam(page) {
    return page.previousPage
  },
  getNextPageParam(page) {
    return page.nextPage
  },
  initialData() {
    return {
      pageParams: [],
      pages: []
    }
  }
})

const items = shallowRef<TBoardItem[]>([])
watch(
  data,
  newVal => {
    items.value = [...(newVal?.pages.flatMap(page => page.data) || [])]
  },
  {
    deep: true,
    immediate: true
  }
)

const emit = defineEmits<{
  refetch: []
}>()

const itemsSortableReady = ref(false)
const itemsRef = (el: Element | ComponentPublicInstance | null) => {
  if (!el || itemsSortableReady.value) return
  itemsSortableReady.value = true
  useSortable(el as HTMLElement, items, {
    animation: 150,
    group: 'base-kanban-items',
    filter: '.base-kanban-item-disabled',
    onAdd(event) {
      const { id, sortOrder } = parseSortableEvent(event, 'item')
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
    onUpdate: event => {
      if (event.oldIndex === event.newIndex) return
      const { id, sortOrder } = parseSortableEvent(event, 'item')
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
    <div class="relative flex-1 flex flex-col overflow-hidden">
      <UProgress
        v-if="isFetching"
        :ui="{ base: 'rounded-none' }"
        size="sm"
        class="absolute top-px left-0 w-full z-10"
      />
      <BaseInfiniteScrollable
        :fetch-next-page="fetchNextPage"
        :is-fetching-next-page="isFetchingNextPage"
      >
        <template #default="{ onScroll }">
          <div
            :ref="itemsRef"
            class="overflow-y-auto scrollbar border-x border-b border-default rounded-b-lg bg-elevated/40 p-3 flex flex-col gap-3 relative"
            @scroll="onScroll"
          >
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
              class="text-center text-muted text-sm italic py-8 base-kanban-item-disabled"
            >
              No items
            </div>
          </div>
        </template>
      </BaseInfiniteScrollable>
    </div>
  </ClientOnly>
</template>
