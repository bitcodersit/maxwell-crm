<script context="module" lang="ts">
type TTextDisplay = {
  type: 'text'
  class: string
  length: number
}

type TArrayDisplay = {
  type: 'array'
  slice: number
  class?: string
}

type TInfoPopup = {
  class?: string
  label: string
  content: () => string | VNode
}

type TDisplay = TTextDisplay | TArrayDisplay
type TFormMode = 'create' | 'update'
type TFormState = Record<string, any>
//
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import type {
  TableData,
  InputProps,
  SelectProps,
  TextareaProps,
  TableColumn,
  FormSubmitEvent,
  DropdownMenuItem,
  ModalProps,
} from '@nuxt/ui'
import type { TDateFilterProps } from './BaseDateFilter.vue'
import type { TInputFilterProps } from './BaseInputFilter.vue'
import type { TBaseAutocompleteProps } from './BaseAutocomplete.vue'
import type { TCheckboxFilterApiProps } from './BaseCheckboxFilterApi.vue'
import { isVNode } from 'vue'

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  pinned?: 'left' | 'right'
  sortBy?: string
  display?: TDisplay
}

export type TFilter = { name: string } & (
  | { type: 'date'; props?: TDateFilterProps }
  | { type: 'input'; props?: TInputFilterProps }
  | { type: 'select'; props?: SelectProps }
  | { type: 'checkbox-api'; props: TCheckboxFilterApiProps }
)

export type TField = { name: string; label: string; col?: string } & (
  | { type: 'input'; props?: InputProps }
  | { type: 'textarea'; props?: TextareaProps }
  | { type: 'autocomplete'; props: TBaseAutocompleteProps }
)

export type TBaseCrudModal = {
  form?: (v: { mode: TFormMode }) => ModalProps
}

export type TQuery = {
  page: number
  perPage: number
  orderBy: Record<string, 'asc' | 'desc'>
  [key: string]: any
}

export type TGetActions<T> = (item: T, options?: { view?: boolean }) => DropdownMenuItem[][]

const props = withDefaults(
  defineProps<{
    getUrl: string
    modal?: TBaseCrudModal
    fields?: TField[]
    filters?: TFilter[]
    columns?: TColumn<T>[]
    postUrl?: string
    formItem?: Record<string, any>
    exportUrl?: string
    formClass?: string
    staleTime?: number
    dateFields?: string[]
    perPageOptions?: number[]
    deleteUrl?: string | ((item: T | T[]) => string)
    getActions?: TGetActions<T>
    getPostBody?: (state: TFormState) => object | FormData
    getFormState?: (item?: T) => TFormState
  }>(),
  {
    staleTime: 30 * 1000,
    fields: () => [],
    filters: () => [],
    columns: () => [],
    dateFields: () => [],
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

const {
  getUrl,
  columns,
  postUrl,
  exportUrl,
  deleteUrl,
  staleTime,
  dateFields,
  getPostBody,
  getFormState,
} = toRefs(props)

const def = toPaginated<T>()
const table = useTemplateRef('table')

const initialQuery = {
  page: def.page,
  perPage: def.perPage,
  orderBy: {},
}

const getPersisted = <T>(
  key: string,
  parser: (v: TMaybe<string>, parse: (value: string, initial?: T) => T) => T
) => {
  const parse = <T>(value: string, initial?: T) => {
    try {
      const parsed = JSON.parse(value)
      return {
        ...parsed,
        ...calendarFormatDates(parsed, dateFields.value, {
          returnType: 'dateValue',
        }),
      }
    } catch {}
    return { ...initial }
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${getUrl.value}:${key}`)
    return parser(stored, parse)
  }
  return parser(undefined, parse)
}

const query = ref(
  getPersisted<TQuery>('query', (v, parse) => {
    return v ? parse(v, initialQuery) : { ...initialQuery }
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

const fetchQuery = computed(() => {
  return calendarFormatDates(query.value, dateFields.value, {
    formatStr: 'yyyy-MM-dd',
  })
})

const { data, status } = useFetch<TPaginated<T>>(getUrl, {
  key,
  lazy: true,
  server: false,
  query: fetchQuery,
  default: () => def,
  getCachedData(key) {
    const data = nuxtApp.payload.data[key]
    if (!data || Date.now() - data.fetchedAt > staleTime.value) return
    return data
  },
  transform(data) {
    return {
      ...data,
      fetchedAt: Date.now(),
    }
  },
})

const UButton = resolveComponent('UButton')
const UPopover = resolveComponent('UPopover')

const getInfoPopup = (options: TInfoPopup) => {
  return h(
    UPopover,
    {
      ui: {
        content: ['p-3 max-w-md w-full max-h-[50vh] overflow-y-auto', options.class],
      },
    },
    {
      content: options.content,
      default: () => [
        h(UButton, {
          size: 'xs',
          class: 'px-0',
          color: 'primary',
          variant: 'link',
          label: options.label,
        }),
      ],
    }
  )
}

const mColumns = computed<TableColumn<T>[]>(() => {
  return columns.value.map(({ pinned, cell, sortBy, header, display, ...item }) => {
    return {
      ...item,
      cell: display
        ? (ctx) => {
            const getValue = (v?: any) => {
              return typeof cell === 'function' ? cell({ ...ctx, ...v }) : cell
            }
            if (display.type === 'text') {
              const text = getValue()
              if (typeof text !== 'string' || !text) return text
              return h('div', { class: ['flex items-center', display.class] }, [
                h('div', { class: 'truncate' }, text),
                text.length > display.length
                  ? getInfoPopup({
                      class: display.class,
                      label: 'more',
                      content: () => text,
                    })
                  : null,
              ])
            }
            if (display.type === 'array') {
              const items = getValue()
              if (!Array.isArray(items) || !items.length) return items
              const visible = items.slice(0, display.slice)
              const hidden = items.length - visible.length
              return h('div', { class: 'flex items-center' }, [
                ...visible,
                hidden > 0
                  ? getInfoPopup({
                      class: display.class,
                      label: `+${hidden} more`,
                      content: () => getValue({ modal: true }),
                    })
                  : null,
              ])
            }
          }
        : cell,
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
const formMode = ref<TFormMode>('create')
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
    .then((item) => {
      toast.add({
        color: 'success',
        title: 'Success',
        description:
          formMode.value === 'create' ? 'Item added successfully' : 'Item updated successfully',
      })
      formOpen.value = false
      selected.value = {}
      refreshKey.value++
      if (viewModal.value && viewItem.value) {
        onView(item as T)
      }
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
const onDelete = async (item: T | T[]) => {
  if (!deleteUrl.value) throw new Error('Delete URL is not set')
  const url =
    typeof deleteUrl.value === 'function'
      ? deleteUrl.value(item)
      : deleteUrl.value.replace(
          '{id}',
          Array.isArray(item) ? item.map((x) => x.id).join(',') : item.id
        )
  if (await confirm('Are you sure you want to delete this item?')) {
    isSubmitting.value = true
    $fetch(url, { method: 'DELETE' })
      .then(() => {
        toast.add({
          color: 'success',
          title: 'Success! 🎉',
          description: 'Item deleted successfully',
        })
        refreshKey.value++
        viewModal.value = false
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

const getSelectedRows = () => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
}

const getSelectedRowItems = () => {
  return getSelectedRows().map((row) => row.original)
}

const onDeleteSelected = () => {
  const items = getSelectedRowItems()
  if (!items?.length) return
  onDelete(items)
}

const onGotoFirstPage = () => {
  query.value.page = 1
}

watch(
  query,
  (v) => {
    localStorage.setItem(
      `${getUrl.value}:query`,
      JSON.stringify(
        calendarFormatDates(v, dateFields.value, {
          returnType: 'storage',
        })
      )
    )
  },
  { deep: true }
)

watch(selected, (v) => {
  localStorage.setItem(`${getUrl.value}:selected`, JSON.stringify(v))
})

type TViewOptions = {
  modal?: ModalProps
}

const viewItem = ref<T>()
const viewModal = ref(false)
const viewItems = ref<any[]>([])
const viewProps = ref<TViewOptions>({})

const onView = (item: T, props = viewProps.value) => {
  viewItem.value = item
  viewProps.value = props || {}
  viewItems.value = columns.value
    .filter((v) => !(v.id && ['select'].includes(v.id)))
    .map(({ id, accessorKey, header, cell }: any) => {
      const td = cell
        ? typeof cell === 'function'
          ? cell({ row: { original: item } })
          : cell
        : item[accessorKey as keyof T]
      return {
        id: id || accessorKey,
        tr: id === 'action' ? header || 'Actions' : header,
        td: Array.isArray(td) ? h('div', {}, td) : td,
      }
    })
  viewModal.value = true
}

defineExpose({
  onView,
  onUpdate,
  onDelete,
  onDeleteSelected,
})

// Export
const exportOpen = ref(false)
const exportState = ref({
  format: 'excel',
  selection: 'all',
})

const { exporting, execute: onExport } = useExport()
const onSubmitExport = async (_values: FormSubmitEvent<typeof exportState.value>) => {
  if (!exportUrl.value) return console.error('Export URL is not set')
  if (
    exportState.value.selection === 'selected' &&
    !table.value?.tableApi?.getFilteredSelectedRowModel().rows.length
  ) {
    toast.add({
      color: 'error',
      title: 'Error! 😭',
      description: 'No selected rows',
    })
    return
  }
  await onExport(exportUrl.value, {
    ...fetchQuery.value,
    ...exportState.value,
    ...(exportState.value.selection === 'selected'
      ? {
          id: getSelectedRowItems()
            .map((item: any) => item.id)
            .join(','),
        }
      : {}),
  })
  exportOpen.value = false
}
//
</script>

<template>
  <ClientOnly>
    <div class="flex items-center justify-between gap-2 flex-wrap">
      <div class="flex items-center gap-2 flex-wrap">
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
          <BaseCheckboxFilterApi
            v-else-if="row.type === 'checkbox-api'"
            v-bind="row.props"
            v-model="query[row.name]"
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
      <div class="flex items-center gap-2 flex-wrap">
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
          <!-- <slot name="bulk-actions" /> -->
          <UButton
            label="Delete"
            color="error"
            variant="subtle"
            icon="i-lucide-trash"
            :ui="{ leadingIcon: 'size-4' }"
            @click="onDeleteSelected"
          >
            <template #trailing>
              <UKbd>
                {{ getSelectedRowItems().length }}
              </UKbd>
            </template>
          </UButton>
        </template>
        <UPopover
          v-if="exportUrl"
          v-model:open="exportOpen"
          :ui="{ content: 'p-4 max-w-sm w-full' }"
          :content="{ align: 'end', side: 'bottom' }"
        >
          <UTooltip text="Export">
            <UButton icon="i-lucide-download" color="primary" variant="solid" label="Export" />
          </UTooltip>
          <template #content>
            <UForm
              :state="exportState"
              :loading="exporting"
              class="flex flex-col gap-4"
              @submit="onSubmitExport"
            >
              <UFormField label="Selection">
                <URadioGroup
                  v-model="exportState.selection"
                  variant="table"
                  orientation="horizontal"
                  :items="[
                    {
                      label: 'All',
                      value: 'all',
                    },
                    {
                      label: 'Selected',
                      value: 'selected',
                    },
                    {
                      label: 'Current Page',
                      value: 'current-page',
                    },
                  ]"
                />
              </UFormField>
              <UFormField label="Format">
                <URadioGroup
                  v-model="exportState.format"
                  variant="table"
                  orientation="horizontal"
                  :items="[
                    { label: 'Excel', value: 'excel' },
                    { label: 'CSV', value: 'csv' },
                  ]"
                />
              </UFormField>
              <div class="flex justify-end">
                <UButton type="submit" icon="i-lucide-download" :loading="exporting">
                  Export
                </UButton>
              </div>
            </UForm>
          </template>
        </UPopover>
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
      class="flex-1"
      :sticky="true"
      :data="data.data"
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
        v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
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
    <UModal v-model:open="viewModal" title="View Details" v-bind="viewProps.modal">
      <template #body>
        <table class="w-full border-collapse text-sm text-left">
          <tbody>
            <tr v-for="item in viewItems" :key="item.id">
              <th class="border border-default px-4 py-2">{{ item.tr }}</th>
              <td class="border border-default px-4 py-2">
                <div
                  v-if="viewItem && item.id === 'action'"
                  class="flex items-center flex-wrap gap-2"
                >
                  <UButton
                    v-for="action in getActions(viewItem, { view: true }).flat()"
                    size="sm"
                    variant="subtle"
                    v-bind="action"
                    @click="action.onSelect"
                  />
                </div>
                <component v-else-if="isVNode(item.td)" :is="item.td" />
                <template v-else>{{ item.td }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </UModal>
    <UModal v-model:open="formOpen" v-bind="modal?.form?.({ mode: formMode })">
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
