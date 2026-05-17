<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'

type TData = Record<string, any>

type TItemMovePayload = {
  itemId: number
  columnId: number
  beforeItemId?: number
  afterItemId?: number
}

type TColumnReorderPayload = {
  columnId: number
  beforeColumnId?: number
  afterColumnId?: number
}

const props = withDefaults(
  defineProps<{
    columns: TData[]
    items: TData[]
    loading?: boolean
    columnIdKey?: string
    columnTitleKey?: string
    columnColorKey?: string
    columnPinnedKey?: string
    itemIdKey?: string
    itemColumnIdKey?: string
    sortColumns?: boolean
  }>(),
  {
    loading: false,
    columnIdKey: 'id',
    columnTitleKey: 'name',
    columnColorKey: 'color',
    columnPinnedKey: 'pinned',
    itemIdKey: 'id',
    itemColumnIdKey: 'columnId',
    sortColumns: true
  }
)

const emit = defineEmits<{
  itemMove: [payload: TItemMovePayload]
  itemClick: [item: TData]
  columnReorder: [payload: TColumnReorderPayload]
}>()

const getNumber = (item: TData, key: string) => Number(item?.[key] ?? 0)
const getString = (item: TData, key: string) => (item?.[key] || '').toString()
const getBool = (item: TData, key: string) => !!item?.[key]

const getColumnId = (column: TData) => getNumber(column, props.columnIdKey)
const getColumnTitle = (column: TData) => getString(column, props.columnTitleKey)
const getColumnColor = (column: TData) => getString(column, props.columnColorKey)
const isColumnPinned = (column: TData) => getBool(column, props.columnPinnedKey)
const getItemId = (item: TData) => getNumber(item, props.itemIdKey)
const getItemColumnId = (item: TData) => getNumber(item, props.itemColumnIdKey)

const columnsContainerRef = ref<HTMLElement | null>(null)
const columnModels = ref<TData[]>([])
const columnSortableReady = ref(false)

const listEls = ref<Record<number, HTMLElement | null>>({})
const listModels = ref<Record<number, TData[]>>({})
const itemSortableReady = new Set<number>()

const syncColumnModelsFromProps = () => {
  columnModels.value = [...props.columns]
}

const syncListModelsFromProps = () => {
  const next: Record<number, TData[]> = {}
  for (const column of props.columns) {
    const columnId = getColumnId(column)
    next[columnId] = props.items.filter(item => getItemColumnId(item) === columnId)
  }
  listModels.value = next
}

watch(
  () => props.columns,
  () => {
    syncColumnModelsFromProps()
    syncListModelsFromProps()
  },
  {
    immediate: true,
    deep: true
  }
)

watch(
  () => props.items,
  () => {
    syncListModelsFromProps()
  },
  {
    deep: true
  }
)

const getAllItemsById = () => {
  const byId = new Map<number, TData>()
  for (const row of Object.values(listModels.value).flat()) {
    byId.set(getItemId(row), row)
  }
  return byId
}

const applyItemReorder = (
  itemId: number,
  columnId: number,
  oldIndex: number,
  newIndex: number,
  fromColumnId?: number
) => {
  const byId = getAllItemsById()
  const sourceColumnId = fromColumnId ?? columnId
  const sourceList = [...(listModels.value[sourceColumnId] || [])]
  const targetList =
    sourceColumnId === columnId ? sourceList : [...(listModels.value[columnId] || [])]

  let finalIds: number[]
  if (sourceColumnId === columnId) {
    if (targetList.map(getItemId)[newIndex] === itemId) {
      finalIds = targetList.map(getItemId)
    } else {
      finalIds = targetList.map(getItemId)
      const [moved] = finalIds.splice(oldIndex, 1)
      if (moved !== itemId) {
        const currentIndex = finalIds.indexOf(itemId)
        if (currentIndex < 0) return
        finalIds.splice(currentIndex, 1)
      }
      finalIds.splice(newIndex, 0, itemId)
    }
    listModels.value[columnId] = finalIds.map(id => byId.get(id)).filter((v): v is TData => !!v)
  } else {
    const sourceIds = sourceList.map(getItemId)
    const removed = sourceIds.splice(oldIndex, 1)[0]
    if (removed !== itemId) return
    listModels.value[sourceColumnId] = sourceIds
      .map(id => byId.get(id))
      .filter((v): v is TData => !!v)

    const targetIds = targetList.map(getItemId)
    targetIds.splice(newIndex, 0, itemId)
    finalIds = targetIds
    listModels.value[columnId] = finalIds.map(id => byId.get(id)).filter((v): v is TData => !!v)
  }

  const beforeItemId = finalIds[newIndex + 1]
  const afterItemId = finalIds[newIndex - 1]

  if (beforeItemId === itemId || afterItemId === itemId) return

  emit('itemMove', {
    itemId,
    columnId,
    beforeItemId,
    afterItemId
  })
}

const onItemSortEnd = (event: {
  item: HTMLElement
  from: HTMLElement
  to: HTMLElement
  oldIndex?: number
  newIndex?: number
}) => {
  const itemId = Number(event.item.dataset.itemId)
  const columnId = Number(event.to.dataset.columnId)
  const fromColumnId = Number(event.from.dataset.columnId)
  if (!Number.isInteger(itemId) || !Number.isInteger(columnId)) return
  if (event.oldIndex === undefined || event.newIndex === undefined) return
  if (event.oldIndex === event.newIndex && fromColumnId === columnId) return

  applyItemReorder(
    itemId,
    columnId,
    event.oldIndex,
    event.newIndex,
    Number.isInteger(fromColumnId) ? fromColumnId : undefined
  )
}

const applyColumnReorder = (columnId: number, oldIndex: number, newIndex: number) => {
  const byId = new Map(columnModels.value.map(column => [getColumnId(column), column]))
  const orderedIds = columnModels.value.map(column => getColumnId(column))

  let finalIds: number[]
  if (orderedIds[newIndex] === columnId) {
    // useSortable already synced columnModels
    finalIds = orderedIds
  } else {
    finalIds = [...orderedIds]
    const [moved] = finalIds.splice(oldIndex, 1)
    if (moved !== columnId) {
      const currentIndex = finalIds.indexOf(columnId)
      if (currentIndex < 0) return
      finalIds.splice(currentIndex, 1)
    }
    finalIds.splice(newIndex, 0, columnId)
  }

  columnModels.value = finalIds
    .map(id => byId.get(id))
    .filter((column): column is TData => !!column)

  const beforeColumnId = finalIds[newIndex + 1]
  const afterColumnId = finalIds[newIndex - 1]

  if (beforeColumnId === columnId || afterColumnId === columnId) return

  emit('columnReorder', {
    columnId,
    beforeColumnId,
    afterColumnId
  })
}

const onColumnSortEnd = (event: { item: HTMLElement; oldIndex?: number; newIndex?: number }) => {
  const columnId = Number(event.item.dataset.kanbanColumnId)
  if (!Number.isInteger(columnId)) return
  if (event.oldIndex === undefined || event.newIndex === undefined) return
  if (event.oldIndex === event.newIndex) return

  applyColumnReorder(columnId, event.oldIndex, event.newIndex)
}

const ensureColumnSortable = (el: Element | null) => {
  if (!el || columnSortableReady.value || !props.sortColumns) return
  columnSortableReady.value = true
  columnsContainerRef.value = el as HTMLElement

  useSortable(columnsContainerRef, columnModels, {
    animation: 150,
    handle: '.kanban-column-handle',
    filter: '.kanban-column--pinned',
    draggable: '[data-kanban-column-id]',
    direction: 'horizontal',
    onEnd: onColumnSortEnd
  })
}

const ensureItemSortable = (columnId: number, el: HTMLElement | null) => {
  listEls.value[columnId] = el
  if (!el || itemSortableReady.has(columnId)) return
  itemSortableReady.add(columnId)

  const model = computed({
    get: () => listModels.value[columnId] || [],
    set: rows => {
      listModels.value[columnId] = rows
    }
  })

  useSortable(el, model, {
    group: 'base-kanban-items',
    animation: 150,
    handle: '.kanban-card-handle',
    onEnd: onItemSortEnd
  })
}

watch(
  () => props.loading,
  loading => {
    if (loading) {
      columnSortableReady.value = false
      columnsContainerRef.value = null
    }
  }
)
</script>

<template>
  <div
    v-if="loading"
    class="flex items-center justify-center py-16 text-muted text-sm"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-5 animate-spin mr-2"
    />
    Loading board...
  </div>

  <div
    v-else
    :ref="(el: any) => ensureColumnSortable(el)"
    class="flex-1 overflow-y-hidden overflow-x-auto scrollbar px-4 py-4 flex gap-4 relative"
  >
    <div
      v-for="column in columnModels"
      :key="getColumnId(column)"
      :data-kanban-column-id="getColumnId(column)"
      class="flex-none w-96 flex flex-col overflow-hidden"
      :class="{
        'kanban-column--pinned': isColumnPinned(column)
      }"
    >
      <div
        class="flex-none flex items-center gap-2 px-3 py-2 rounded-t-lg border-t-4 bg-elevated"
        :style="{
          borderTopColor: getColumnColor(column) || 'var(--ui-border)'
        }"
      >
        <button
          v-if="sortColumns && !isColumnPinned(column)"
          type="button"
          class="kanban-column-handle shrink-0 p-0.5 rounded text-muted hover:text-highlighted hover:bg-default cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag column"
          @click.stop
        >
          <UIcon
            name="i-lucide-grip-vertical"
            class="size-4"
          />
        </button>
        <div class="flex-1 min-w-0">
          <slot
            name="column-header"
            :column="column"
            :count="listModels[getColumnId(column)]?.length || 0"
            :pinned="isColumnPinned(column)"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-sm font-semibold text-highlighted truncate">
                #{{ getItemColumnId(column) }} - {{ getColumnTitle(column) }}
              </span>
              <UBadge
                :label="String(listModels[getColumnId(column)]?.length || 0)"
                color="neutral"
                variant="soft"
                size="xs"
              />
            </div>
          </slot>
        </div>
      </div>

      <div
        :ref="(el: any) => ensureItemSortable(getColumnId(column), el)"
        :data-column-id="getColumnId(column)"
        class="flex flex-col gap-2 p-2 bg-elevated/40 rounded-b-lg border border-default border-t-0 min-h-32 overflow-y-auto scrollbar"
      >
        <div
          v-for="item in listModels[getColumnId(column)] || []"
          :key="getItemId(item)"
          :data-item-id="getItemId(item)"
          class="kanban-card-handle bg-default rounded-lg border border-default p-3 shadow-xs hover:shadow-sm cursor-grab active:cursor-grabbing transition-shadow"
          @click="emit('itemClick', item)"
        >
          <slot
            name="item"
            :item="item"
            :column="column"
          >
            <p class="text-sm text-highlighted font-medium">
              {{ item.name || item.title || `Item #${getItemId(item)}` }}
            </p>
          </slot>
        </div>

        <div
          v-if="!(listModels[getColumnId(column)] || []).length"
          class="text-center py-4 text-xs text-muted italic"
        >
          No items
        </div>
      </div>
    </div>
  </div>
</template>
