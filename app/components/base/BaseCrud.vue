<script setup lang="ts" generic="T extends object">
import type { TableColumn, TableData, DropdownMenuItem } from '@nuxt/ui'
import type { TInputFilterProps } from './BaseInputFilter.vue'

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  pinned?: 'left' | 'right'
  sortBy?: string
}

export type TFilter = { id: string } & (
  | ({ type: 'input' } & TInputFilterProps)
  | ({ type: 'select' } & { options: [] })
)

export type TQuery = {
  page: number
  perPage: number
  orderBy: Record<string, 'asc' | 'desc'>
  [key: string]: any
}

const props = withDefaults(
  defineProps<{
    getUrl: string
    sticky?: boolean
    columns?: TColumn<T>[]
    filters?: TFilter[]
    perPageOptions?: number[]
    enableRowSelection?: boolean
    actions?: (item: T) => DropdownMenuItem[][]
  }>(),
  {
    sticky: true,
    enableRowSelection: true,
    filters: () => [],
    columns: () => [],
    actions: () => [],
    perPageOptions: () => [5, 10, 20, 30, 40, 50, 100],
  }
)

const def = toPaginated<T>()
const table = useTemplateRef('table')
const rowSelection = ref<Record<string, boolean>>({})

const initialQuery = {
  page: def.page,
  perPage: def.perPage,
  orderBy: {},
}

const initialKeys = Object.keys(initialQuery)
const query = reactive<TQuery>({
  ...initialQuery,
})

const { getUrl, columns, filters } = toRefs(props)
const { data, status } = useFetch<TPaginated<T>>(getUrl, {
  query,
  default: () => def,
})

const UButton = resolveComponent('UButton')
const mColumns = computed<TableColumn<T>[]>(() => {
  return columns.value.map(({ pinned, sortBy, header, ...item }) => {
    return {
      ...item,
      header({ column, ...rest }) {
        if (pinned && !column.getIsPinned()) {
          column.pin(pinned)
        }
        if (typeof header === 'function') {
          return header({ column, ...rest })
        }
        if (sortBy) {
          const v = query.orderBy[sortBy]
          return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: header,
            icon: v
              ? v === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
              : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            ui: {
              leadingIcon: 'size-4',
            },
            onClick() {
              if (!v) {
                query.orderBy[sortBy] = 'asc'
              } else if (v === 'asc') {
                query.orderBy[sortBy] = 'desc'
              } else {
                delete query.orderBy[sortBy]
              }
            },
          })
        }
        return header
      },
    } as TableColumn<T>
  })
})

const isClearable = computed(() => {
  return Object.keys(query).some((key) => !initialKeys.includes(key))
})

const onClearFilters = () => {
  const queryKeys = Object.keys(query)
  queryKeys.forEach((key) => {
    if (!initialKeys.includes(key)) {
      delete query[key]
    }
  })
  Object.entries(initialQuery).forEach(([key, value]) => {
    query[key] = value
  })
}

const onClearOrderBy = () => {
  query.orderBy = {}
}
</script>

<template>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-2">
      <template v-for="row in filters" :key="row.id">
        <BaseInputFilter
          v-if="row.type === 'input'"
          v-bind="row"
          v-model="query[row.id]"
          v-model:mode="query[row.id + 'Mode']"
        />
      </template>
      <UButton
        v-if="isClearable"
        icon="i-lucide-filter"
        size="sm"
        color="error"
        variant="subtle"
        @click="onClearFilters"
      >
        Clear
      </UButton>
      <UButton
        v-if="Object.keys(query.orderBy).length"
        icon="i-lucide-arrow-up-down"
        size="sm"
        color="error"
        variant="subtle"
        @click="onClearOrderBy"
      >
        Clear
      </UButton>
    </div>
    <div class="flex items-center gap-2">
      <UButton size="sm" icon="i-lucide-plus" color="primary" variant="solid">Add New</UButton>
    </div>
  </div>
  <UTable
    ref="table"
    v-model:row-selection="rowSelection"
    :data="data.data"
    :sticky="sticky"
    :columns="mColumns"
    :loading="status === 'pending'"
    :ui="{
      base: 'table-fixed border-separate border-spacing-0',
      thead: '[&>tr]:after:content-none',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
      td: 'border-b border-default',
      separator: 'h-0',
    }"
  >
    <template #select-header="{ column, table }">
      <div class="pr-4">
        <UCheckbox
          :model-value="
            table.getIsSomePageRowsSelected() ? 'indeterminate' : table.getIsAllPageRowsSelected()
          "
          aria-label="Select all"
          @update:model-value="(v) => table.toggleAllPageRowsSelected(!!v)"
        />
      </div>
      {{ !column.getIsPinned() ? column.pin('left') : '' }}
    </template>
    <template #select-cell="{ row }">
      <UCheckbox
        :model-value="row.getIsSelected()"
        aria-label="Select row"
        @update:model-value="(v) => row.toggleSelected(!!v)"
      />
    </template>
    <template #action-cell="{ row }">
      <UDropdownMenu :items="actions(row.original)">
        <UButton
          icon="i-lucide-ellipsis-vertical"
          color="neutral"
          variant="ghost"
          aria-label="Actions"
        />
      </UDropdownMenu>
    </template>
  </UTable>
  <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4">
    <div
      v-if="(enableRowSelection && table?.tableApi?.getFilteredSelectedRowModel().rows.length) || 0"
      class="text-sm text-muted"
    >
      {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
      {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
    </div>
    <div v-else class="text-sm text-muted">
      Showing {{ query.perPage }} of {{ data.total }} row(s) total
    </div>

    <div class="flex items-center gap-3">
      <USelect v-model="query.perPage" :items="perPageOptions" class="min-w-20" />
      <UPagination v-model:page="query.page" :items-per-page="query.perPage" :total="data.total" />
    </div>
  </div>
</template>
