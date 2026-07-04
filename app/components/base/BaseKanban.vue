<script lang="ts">
import type { TBaseFormField } from './BaseForm.vue'
import { useSortable } from '@vueuse/integrations/useSortable'
</script>

<script setup lang="ts" generic="Item extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    initialQuery: Record<string, any>
    getItem: (v: TBoardItem) => Item
    itemsQuery?: Record<string, any>
  }>(),
  {
    itemsQuery: () => ({})
  }
)

const client = useQueryClient()
const queryKey = computed(() => {
  return ['/api/boards/find', props.initialQuery] as const
})

const { data, isFetching, refetch } = useQuery({
  queryKey,
  queryFn: ({ queryKey: [api, query] }) => {
    return $fetch<TBoard>(api, {
      query
    })
  }
})

const toast = useToast()

// Columns
const columns = shallowRef<TBoardColumn[]>([])
const columnsSortableReady = ref(false)

const columnsRef = (el: Element | ComponentPublicInstance | null) => {
  if (!el || columnsSortableReady.value) return
  columnsSortableReady.value = true
  useSortable(el as HTMLElement, columns, {
    animation: 150,
    handle: '.base-kanban-handle',
    filter: '.base-kanban-pinned',
    direction: 'horizontal',
    onUpdate: event => {
      if (event.oldIndex === event.newIndex) return
      const { id, sortOrder } = parseSortableEvent(event, 'column')
      $fetch<TBoardColumn>('/api/board-columns', {
        method: 'POST',
        body: {
          id,
          sortOrder
        }
      })
        .then(data => {
          columns.value = columns.value.map(column => {
            if (column.id === data.id) {
              return { ...column, ...data }
            }
            return column
          })
        })
        .catch(error => {
          toast.add({
            title: 'Error',
            color: 'error',
            description: error.message
          })
        })
    },
    onMove(evt) {
      if (evt.related.classList.contains('base-kanban-pinned')) {
        return false
      }
    }
  })
}

watch(
  data,
  newVal => {
    columns.value = [...(newVal?.columns || [])]
  },
  {
    deep: true,
    immediate: true
  }
)

// Column Form
const columnFormOpen = ref(false)
const columnFormState = ref<Partial<TBoardColumn>>({
  name: '',
  color: ''
})

const columnFields: TBaseFormField[] = [
  {
    name: 'name',
    label: 'Column Name',
    type: 'input'
  },
  {
    name: 'color',
    label: 'Column Color',
    type: 'color'
  }
]

const onColumnFormOpen = (item?: TBoardColumn) => {
  columnFormState.value = {
    id: item?.id,
    name: item?.name ?? '',
    color: item?.color,
    boardId: item?.boardId ?? data.value?.id
  }
  columnFormOpen.value = true
}

const onColumnFormSuccess = () => {
  client.invalidateQueries({
    queryKey: queryKey.value
  })
}
</script>

<template>
  <ClientOnly>
    <UProgress
      v-if="isFetching"
      :ui="{ base: 'rounded-none' }"
      size="sm"
      class="absolute top-0 left-0 w-full"
    />
    <div
      class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 sm:px-6 pb-4 sm:pb-6 flex gap-4 relative"
    >
      <div
        :ref="columnsRef"
        class="flex-1 flex gap-4 sm:gap-6"
      >
        <BaseKanbanColumn
          v-for="column in columns"
          :key="column.id"
          :column="column"
          @refetch="refetch"
          @update="onColumnFormOpen"
        >
          <BaseKanbanItems
            v-if="data?.id"
            :column-id="column.id"
            :get-item="getItem"
            :items-query="itemsQuery"
            @refetch="refetch"
          >
            <template #item="attrs">
              <slot
                name="item"
                v-bind="attrs"
              />
            </template>
          </BaseKanbanItems>
        </BaseKanbanColumn>
      </div>
      <div class="flex-none">
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="neutral"
          variant="soft"
          @click="onColumnFormOpen()"
        >
          Add Column
        </UButton>
      </div>
    </div>
    <BaseFormModal
      v-model="columnFormState"
      v-model:open="columnFormOpen"
      :api="`/api/board-columns`"
      :fields="columnFields"
      :field-props="{ size: 'xl', class: 'w-full' }"
      :title="columnFormState.id ? 'Edit Column' : 'Add Column'"
      :description="
        columnFormState.id ? 'Edit the column information' : 'Add a new column to the board'
      "
      @success="onColumnFormSuccess"
    />
  </ClientOnly>
</template>
