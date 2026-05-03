<script setup lang="ts" generic="T extends object">
import type { TableColumn, TableData, DropdownMenuItem } from '@nuxt/ui'

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  sortable?: boolean
  pinned?: 'left' | 'right'
}

const props = withDefaults(
  defineProps<{
    getUrl: string
    sticky?: boolean
    columns?: TColumn<T>[]
    perPageOptions?: number[]
    enableRowSelection?: boolean
    actions?: (item: T) => DropdownMenuItem[][]
  }>(),
  {
    sticky: true,
    enableRowSelection: true,
    columns: () => [],
    actions: () => [],
    perPageOptions: () => [5, 10, 20, 30, 40, 50, 100],
  }
)

const def = toPaginated<T>()
const page = ref(def.page)
const perPage = ref(def.perPage)
const table = useTemplateRef('table')
const rowSelection = ref<Record<string, boolean>>({})

const { getUrl, columns } = toRefs(props)
const { data, status } = useFetch<TPaginated<T>>(getUrl, {
  default: () => def,
  query: {
    page,
    perPage,
  },
})

const UButton = resolveComponent('UButton')

const mColumns = computed<TableColumn<T>[]>(() => {
  return columns.value.map(({ pinned, sortable, header, ...item }) => {
    return {
      ...item,
      header({ column, ...rest }) {
        if (pinned && !column.getIsPinned()) {
          column.pin(pinned)
        }
        if (typeof header === 'function') {
          return header({ column, ...rest })
        }
        if (sortable) {
          const isSorted = column.getIsSorted()
          return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label: header,
            icon: isSorted
              ? isSorted === 'asc'
                ? 'i-lucide-arrow-up-narrow-wide'
                : 'i-lucide-arrow-down-wide-narrow'
              : 'i-lucide-arrow-up-down',
            class: '-mx-2.5',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
          })
        }
        return header
      },
    } as TableColumn<T>
  })
})
</script>

<template>
  <UTable
    ref="table"
    v-model:row-selection="rowSelection"
    :data="data.data"
    :sticky="sticky"
    :columns="mColumns"
    :loading="status === 'pending'"
    :ui="{
      base: 'table-fixed border-separate border-spacing-0',
      thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
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
      Showing {{ perPage }} of {{ data.total }} row(s) total
    </div>

    <div class="flex items-center gap-3">
      <USelect v-model="perPage" :items="perPageOptions" class="min-w-20" />
      <UPagination v-model:page="page" :items-per-page="perPage" :total="data.total" />
    </div>
  </div>
</template>
