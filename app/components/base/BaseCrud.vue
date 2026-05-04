<script setup lang="ts" generic="T extends object">
import type {
  TableData,
  InputProps,
  SelectProps,
  TextareaProps,
  TableColumn,
  FormSubmitEvent,
  DropdownMenuItem,
} from '@nuxt/ui'
import type { TInputFilterProps } from './BaseInputFilter.vue'
import type { TBaseAutocompleteProps } from './BaseAutocomplete.vue'
import type { TDateFilterProps } from './BaseDateFilter.vue'

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  pinned?: 'left' | 'right'
  sortBy?: string
}

export type TFilter = { name: string } & (
  | { type: 'date'; props?: TDateFilterProps }
  | { type: 'input'; props?: TInputFilterProps }
  | { type: 'select'; props?: SelectProps }
)

export type TField = { name: string; label: string; col?: string } & (
  | { type: 'input'; props?: InputProps }
  | { type: 'textarea'; props?: TextareaProps }
  | { type: 'autocomplete'; props: TBaseAutocompleteProps }
)

export type TQuery = {
  page: number
  perPage: number
  orderBy: Record<string, 'asc' | 'desc'>
  [key: string]: any
}

type TFormState = Record<string, any>

const props = withDefaults(
  defineProps<{
    getUrl: string
    sticky?: boolean
    fields?: TField[]
    filters?: TFilter[]
    columns?: TColumn<T>[]
    postUrl?: string
    perPageOptions?: number[]
    enableRowSelection?: boolean
    formClass?: string
    formItem?: Record<string, any>
    formModal?: {
      create?: {
        title?: string
        description?: string
      }
      update?: {
        title?: string
        description?: string
      }
    }
    persist?: {
      key: string
      parse?: (v: string) => TQuery
      stringify?: (v: TQuery) => string
    }
    getQuery?: (query: TQuery) => TQuery
    getActions?: (item: T) => DropdownMenuItem[][]
    getPostBody?: (state: TFormState) => object | FormData
    getFormState?: (item?: T) => TFormState
  }>(),
  {
    sticky: true,
    enableRowSelection: true,
    fields: () => [],
    filters: () => [],
    columns: () => [],
    getQuery: (v: TQuery) => v,
    getActions: () => [],
    getPostBody: (state: TFormState) => state,
    getFormState: (v?: T) => ({ ...(v ?? {}) }),
    perPageOptions: () => [5, 10, 20, 30, 40, 50, 100],
    formItem: () => ({
      size: 'xl',
      class: 'w-full',
    }),
  }
)

const { getUrl, columns, postUrl, getFormState, getPostBody, getQuery, persist } = toRefs(props)

const def = toPaginated<T>()
const table = useTemplateRef('table')

const initialQuery = {
  page: def.page,
  perPage: def.perPage,
  orderBy: {},
}

const getPersisted = <T>(
  key: string,
  parser: (v: string | undefined, parse: (v: string) => T) => T
) => {
  const parse = typeof persist.value?.parse === 'function' ? persist.value.parse : JSON.parse
  if (typeof window !== 'undefined' && persist.value?.key) {
    const stored = localStorage.getItem(`${persist.value.key}:${key}`)
    if (stored)
      return parser(
        stored,
        typeof persist.value.parse === 'function' ? persist.value.parse : JSON.parse
      )
  }
  return parser(undefined, parse)
}

const query = ref(
  getPersisted<TQuery>('query', (v, parse) => {
    return v ? parse(v) : { ...initialQuery }
  })
)

const selected = ref(
  getPersisted<Record<string, boolean>>('selected', (v) => {
    return v ? JSON.parse(v) : {}
  })
)

const nuxtApp = useNuxtApp()
const refreshKey = ref(0)
const key = computed(() => `${getUrl.value}:${refreshKey.value}:${JSON.stringify(query.value)}`)

const { data, status, refresh } = useFetch<TPaginated<T>>(getUrl, {
  key,
  query: computed(() => getQuery.value(query.value)),
  lazy: true,
  server: false,
  default: () => def,
  getCachedData(key) {
    return nuxtApp.payload.data[key] || nuxtApp.static.data[key]
  },
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
          const v = query.value.orderBy[sortBy]
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
                query.value.orderBy[sortBy] = 'asc'
              } else if (v === 'asc') {
                query.value.orderBy[sortBy] = 'desc'
              } else {
                delete query.value.orderBy[sortBy]
              }
            },
          })
        }
        return header
      },
    } as TableColumn<T>
  })
})

const initialKeys = Object.keys(initialQuery)
const isClearable = computed(() => {
  return Object.keys(query.value)
    .filter((k) => !initialKeys.includes(k))
    .some((k) => !!query.value[k])
})

const onClearFilters = () => {
  query.value = {
    ...initialQuery,
  }
}

const onClearOrderBy = () => {
  query.value = {
    ...query.value,
    orderBy: {},
  }
}

const formOpen = ref(false)
const formMode = ref<'create' | 'update'>('create')
const formState = ref<TFormState>({})
const isSubmitting = ref(false)

const onAddNew = () => {
  formMode.value = 'create'
  formState.value = getFormState.value()
  formOpen.value = true
}

const onUpdate = (row: T) => {
  formMode.value = 'update'
  formState.value = getFormState.value(row)
  formOpen.value = true
}

const toast = useToast()
const formRef = useTemplateRef('formRef')

const onSubmit = async (event: FormSubmitEvent<TFormState>) => {
  if (!postUrl.value) throw new Error('Post URL is not set')
  isSubmitting.value = true
  $fetch(postUrl.value, {
    method: 'POST',
    body: getPostBody.value(event.data),
  })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Success',
        description:
          formMode.value === 'create' ? 'Item added successfully' : 'Item updated successfully',
      })
      formOpen.value = false
      selected.value = {}
      refresh()
    })
    .catch((e) => {
      const { message, errors } = parseError(e)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'name', message }])
    })
    .finally(() => {
      isSubmitting.value = false
    })
}

const { confirm } = useConfirm()
const onDelete = async (url: string) => {
  if (await confirm('Are you sure you want to delete this item?')) {
    isSubmitting.value = true
    $fetch(url, {
      method: 'DELETE',
    })
      .then(() => {
        toast.add({
          color: 'success',
          title: 'Success! 🎉',
          description: 'Item deleted successfully',
        })
        refresh()
      })
      .catch((e) => {
        const { message } = parseError(e)
        toast.add({
          color: 'error',
          title: 'Error! 😭',
          description: message,
        })
      })
      .finally(() => {
        isSubmitting.value = false
        selected.value = {}
      })
  }
}

const onDeleteSelected = (getUrl: (items: T[]) => string) => {
  const items = table.value?.tableApi?.getFilteredSelectedRowModel().rows.map((row) => row.original)
  if (!items?.length) return
  onDelete(getUrl(items))
}

const onGotoFirstPage = () => {
  query.value.page = 1
}

watch(
  query,
  (v) => {
    if (!persist.value?.key) return
    localStorage.setItem(
      `${persist.value.key}:query`,
      typeof persist.value.stringify === 'function' ? persist.value.stringify(v) : JSON.stringify(v)
    )
  },
  { deep: true }
)

watch(
  selected,
  (v) => {
    if (!persist.value?.key) return
    localStorage.setItem(`${persist.value.key}:selected`, JSON.stringify(v))
  },
  { deep: true }
)

defineExpose({
  onUpdate,
  onDelete,
  onDeleteSelected,
})
</script>

<template>
  <ClientOnly>
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <template v-for="row in filters" :key="row.name">
          <BaseInputFilter
            v-if="row.type === 'input'"
            v-bind="row.props"
            v-model="query[row.name]"
            v-model:mode="query[row.name + 'Mode']"
            @update:model-value="onGotoFirstPage"
          />
          <BaseDateFilter
            v-else-if="row.type === 'date'"
            v-bind="row.props"
            v-model="query[row.name]"
            v-model:mode="query[row.name + 'Mode']"
            @update:model-value="onGotoFirstPage"
          />
        </template>
        <UTooltip text="Refresh data">
          <UButton
            icon="i-lucide-refresh-cw"
            color="primary"
            variant="subtle"
            @click="refreshKey++"
          />
        </UTooltip>
        <UTooltip text="Clear filters">
          <UButton
            v-if="isClearable"
            icon="i-lucide-filter"
            color="error"
            variant="subtle"
            @click="onClearFilters"
          >
            Clear
          </UButton>
        </UTooltip>
        <UTooltip text="Clear Sorting">
          <UButton
            v-if="Object.keys(query.orderBy).length"
            icon="i-lucide-arrow-up-down"
            color="error"
            variant="subtle"
            @click="onClearOrderBy"
          >
            Clear
          </UButton>
        </UTooltip>
      </div>
      <div class="flex items-center gap-2">
        <template v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length">
          <UTooltip text="Clear selection">
            <UButton
              icon="i-lucide-list-todo"
              color="error"
              variant="subtle"
              :ui="{ leadingIcon: 'size-4' }"
              @click="selected = {}"
            >
              Clear
            </UButton>
          </UTooltip>
          <slot
            name="bulk-actions"
            v-bind="{
              count: table?.tableApi?.getFilteredSelectedRowModel().rows.length,
              selected,
            }"
          />
        </template>
        <UTooltip text="Add new item">
          <UButton icon="i-lucide-plus" color="primary" variant="solid" @click="onAddNew">
            Add New
          </UButton>
        </UTooltip>
      </div>
    </div>
    <UTable
      ref="table"
      v-model:row-selection="selected"
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
        <UDropdownMenu :items="getActions(row.original)">
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
        v-if="
          (enableRowSelection && table?.tableApi?.getFilteredSelectedRowModel().rows.length) || 0
        "
        class="text-sm text-muted"
      >
        {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
        {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
      </div>
      <div v-else class="text-sm text-muted">
        Showing {{ query.perPage }} of {{ data.total }} row(s) total
      </div>

      <div class="flex items-center gap-3">
        <UTooltip text="Change items per page">
          <USelect
            v-model="query.perPage"
            :items="perPageOptions"
            class="min-w-20"
            @change="onGotoFirstPage"
          />
        </UTooltip>
        <UPagination
          v-model:page="query.page"
          :items-per-page="query.perPage"
          :total="data.total"
        />
      </div>
    </div>
    <UModal
      v-model:open="formOpen"
      :title="formModal?.[formMode]?.title"
      :description="formModal?.[formMode]?.description"
    >
      <template #body>
        <UForm ref="formRef" :state="formState" @submit="onSubmit">
          <div :class="formClass" class="grid grid-cols-1 gap-4">
            <UFormField
              v-for="row in fields"
              :key="row.name"
              :name="row.name"
              :label="row.label"
              :class="row.col"
            >
              <UInput
                v-if="row.type === 'input'"
                v-model="formState[row.name]"
                v-bind="{ ...formItem, ...row.props }"
              />
              <UTextarea
                v-else-if="row.type === 'textarea'"
                v-model="formState[row.name]"
                v-bind="{ ...formItem, ...row.props }"
              />
              <BaseAutocomplete
                v-else-if="row.type === 'autocomplete'"
                v-model="formState[row.name]"
                v-bind="{ ...formItem, ...row.props }"
              />
            </UFormField>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <UButton
              icon="i-lucide-x"
              type="button"
              color="error"
              variant="subtle"
              @click="formOpen = false"
            >
              Cancel
            </UButton>
            <UButton type="submit" :loading="isSubmitting" icon="i-lucide-send"> Submit </UButton>
          </div>
        </UForm>
      </template>
    </UModal>
  </ClientOnly>
</template>
