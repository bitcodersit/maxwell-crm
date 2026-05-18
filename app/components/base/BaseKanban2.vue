<script lang="ts">
import type { TBaseFormField } from './BaseForm.vue'
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

const client = useQueryClient()
const queryKey = computed(() => {
  return [props.boardName]
})

const { data, isFetching, refetch } = useQuery({
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
    },
    onMove(evt) {
      // evt.related is the element we are hovering over
      if (evt.related.classList.contains('base-kanban-pinned')) {
        return false // Cancel the move
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
    <div class="relative">
      <UProgress
        v-if="isFetching"
        :ui="{ base: 'rounded-none' }"
        size="sm"
        class="absolute top-0 left-0 w-full"
      />
    </div>
    <div class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 py-4 flex gap-4 relative">
      <div
        :ref="columnsRef"
        class="flex-1 flex gap-4"
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
            :board-id="data?.id"
            :column-id="column.id"
            :get-item="getItem"
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
      :on-success="onColumnFormSuccess"
    />
  </ClientOnly>
</template>
