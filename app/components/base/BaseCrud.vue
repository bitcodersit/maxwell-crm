<script lang="ts">
/* eslint-disable no-unused-vars */
import type { TImportFailedColumn } from '@/components/base/BaseImportModal.vue'
import type { TFilterCheckboxProps } from '@/components/filter/FilterCheckbox.vue'
import type { TFilterDateProps } from '@/components/filter/FilterDate.vue'
import type { TFilterInputProps } from '@/components/filter/FilterInput.vue'
import type { TFilterTabsProps } from '@/components/filter/FilterTabs.vue'
import type { TFormAutocompleteProps } from '@/components/form/FormAutocomplete.vue'
import type { TFormSelectMenuProps } from '@/components/form/FormSelectMenu.vue'
import type {
  TableData,
  InputProps,
  SelectProps,
  TextareaProps,
  TableColumn,
  FormSubmitEvent,
  DropdownMenuItem,
  ModalProps
} from '@nuxt/ui'
import { isVNode } from 'vue'

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
type TFormBodyGetter = (state: TFormState) => Record<string, any> | FormData

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  pinned?: 'left' | 'right'
  sortBy?: string
  display?: TDisplay
}

export type TFilter = { name: string } & (
  | { type: 'date'; props?: TFilterDateProps }
  | { type: 'input'; props?: TFilterInputProps }
  | { type: 'inline-input'; props?: InputProps }
  | { type: 'select'; props?: SelectProps }
  | { type: 'checkbox-api'; props: TFilterCheckboxProps }
  | { type: 'tabs'; props: TFilterTabsProps }
)

type TFieldHidden = boolean | ((ctx: { mode: TFormMode }) => boolean)

export type TField =
  | ({ name: string; label: string; col?: string; hidden?: TFieldHidden } & (
      | { type: 'input'; props?: InputProps }
      | { type: 'select'; props?: SelectProps }
      | { type: 'textarea'; props?: TextareaProps }
      | { type: 'autocomplete'; props: TFormAutocompleteProps }
      | { type: 'select-menu'; props: TFormSelectMenuProps }
      | { type: 'team-members'; props?: Record<string, any> }
      | {
          type: 'attachments'
          props?: {
            folder?: string
            attachableModelType?: 'task' | 'lead' | 'followUp' | 'property' | 'visit' | 'comment'
          }
        }
    ))
  | {
      type: 'separator'
      label?: string
      hidden?: TFieldHidden
    }

export type TBaseCrudModal = {
  form?: (v: { mode: TFormMode }) => ModalProps
}

export type TBaseCrudImport = {
  importUrl: string
  exampleUrl: string
  title?: string
  description?: string
  entityLabel?: string
  dropzoneDescription?: string
  failedColumns?: TImportFailedColumn[]
  buttonLabel?: string
}

type TQuery = {
  page?: number
  perPage?: number
  orderBy?: Record<string, 'asc' | 'desc' | undefined>
  [key: string]: any
}

export type TGetActions<T> = (item: T, options?: { view?: boolean }) => DropdownMenuItem[][]
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
const props = withDefaults(
  defineProps<{
    getUrl: string
    modal?: TBaseCrudModal
    fields?: TField[]
    filters?: TFilter[]
    columns?: TColumn<T>[]
    postUrl?: string
    patchUrl?: string | ((state: TFormState) => string)
    formItem?: Record<string, unknown>
    exportUrl?: string
    importConfig?: TBaseCrudImport
    formClass?: string
    gridClass?: string
    leftClass?: string
    deleteUrl?: string | ((item: T | T[]) => string)
    restoreUrl?: string | ((item: T | T[]) => string)
    permanentDelete?: boolean
    dateFields?: string[]
    perPageOptions?: number[]
    initialQuery?: TQuery
    getActions?: TGetActions<T>
    getPostBody?: TFormBodyGetter
    getPatchBody?: TFormBodyGetter
    getFormState?: (item?: T) => TFormState
    showAddButton?: boolean
  }>(),
  {
    showAddButton: true,
    leftClass: 'col-span-1',
    gridClass: 'grid grid-cols-1',
    fields: () => [],
    filters: () => [],
    columns: () => [],
    dateFields: () => [],
    getActions: () => [],
    getPostBody: (state: TFormState) => state,
    getPatchBody: (state: TFormState) => state,
    getFormState: (v?: T) => ({ ...(v ?? {}) }),
    perPageOptions: () => [5, 10, 20, 30, 40, 50, 100],
    permanentDelete: false,
    formItem: () => ({
      size: 'xl',
      class: 'w-full'
    })
  }
)

const {
  getUrl,
  columns,
  postUrl,
  patchUrl,
  exportUrl,
  deleteUrl,
  restoreUrl,
  dateFields,
  getPostBody,
  getPatchBody,
  getFormState
} = toRefs(props)

const def = toPaginated<T>()
const table = useTemplateRef('table')

const fallbackQuery = {
  page: def.page,
  perPage: def.perPage,
  orderBy: {}
}

const initialQuery = computed(() => {
  return {
    ...fallbackQuery,
    ...props.initialQuery
  }
})

const getPersisted = <T,>(
  key: string,
  parser: (v: TMaybe<string>, parse: (value: string, initial?: T) => T) => T
) => {
  const parse = <T,>(value: string, initial?: T) => {
    try {
      const parsed = JSON.parse(value)
      return {
        ...parsed,
        ...initial,
        orderBy: {
          ...parsed?.orderBy,
          ...(initial as any)?.orderBy
        }
      }
    } catch {
      return { ...initial }
    }
  }
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(`${getUrl.value}:${key}`)
    return parser(stored, parse)
  }
  return parser(undefined, parse)
}

const query = ref(
  getPersisted<TQuery>('query', (v, parse) => {
    return v ? parse(v, initialQuery.value) : { ...initialQuery.value }
  })
)

const selected = ref(
  getPersisted<Record<string, boolean>>('selected', v => {
    return v ? JSON.parse(v) : {}
  })
)

const { data, error, isFetching, refetch } = useQuerySSR<TPaginated<T>>({
  retry: false,
  queryKey: [getUrl, query],
  initialData: () => def,
  queryFn: () => {
    return $fetch<TPaginated<T>>(getUrl.value, {
      query: query.value
    })
  }
})

watch(error, v => {
  if (!v) return
  const { description } = parseError(v)
  toast.add({
    color: 'error',
    title: 'Error while fetching data!',
    description
  })
})

const UButton = resolveComponent('UButton')
const UPopover = resolveComponent('UPopover')

const getInfoPopup = (options: TInfoPopup) => {
  return h(
    UPopover,
    {
      ui: {
        content: ['p-3 max-w-md w-full max-h-[50vh] overflow-y-auto', options.class]
      }
    },
    {
      content: options.content,
      default: () => [
        h(UButton, {
          size: 'xs',
          class: 'px-0',
          color: 'primary',
          variant: 'link',
          label: options.label
        })
      ]
    }
  )
}

const mColumns = computed<TableColumn<T>[]>(() => {
  return columns.value.map(({ pinned, cell, sortBy, header, display, ...item }) => {
    return {
      ...item,
      cell: display
        ? ctx => {
            const getValue = (v?: unknown) => {
              return typeof cell === 'function'
                ? cell({ ...ctx, ...(v as Record<string, unknown>) })
                : !cell
                  ? ctx.row.original[(item as any).accessorKey]
                  : cell
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
                      content: () => text
                    })
                  : null
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
                      content: () => getValue({ modal: true })
                    })
                  : null
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
          const v = query.value.orderBy?.[sortBy]
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
              leadingIcon: 'size-4'
            },
            onClick() {
              if (!query.value.orderBy) {
                query.value.orderBy = {}
              }
              if (!v) {
                query.value.orderBy[sortBy] = 'asc'
              } else if (v === 'asc') {
                query.value.orderBy[sortBy] = 'desc'
              } else {
                query.value.orderBy[sortBy] = undefined
              }
            }
          })
        }
        return header
      }
    } as TableColumn<T>
  })
})

// Filter
const isClearable = computed(() => {
  return Object.keys(getDeepDiff(query.value, initialQuery.value)).length > 0
})

const onClearFilters = () => {
  query.value = {
    ...initialQuery.value
  }
}

// Order By
const isOrdered = computed(() => {
  return (
    Object.keys(getDeepDiff(initialQuery.value.orderBy || {}, query.value.orderBy || {})).length > 0
  )
})
const onClearOrderBy = () => {
  query.value = {
    ...query.value,
    orderBy: {
      ...initialQuery.value.orderBy
    }
  }
}

const formOpen = ref(false)
const formMode = ref<TFormMode>('create')
const formState = ref<TFormState>({})
const isSubmitting = ref(false)

const isFieldVisible = (row: TField) => {
  if (!('hidden' in row) || row.hidden === undefined) return true
  if (typeof row.hidden === 'function') return !row.hidden({ mode: formMode.value })
  return !row.hidden
}

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
  const isUpdate = formMode.value === 'update'
  const submitUrl =
    isUpdate && patchUrl.value
      ? typeof patchUrl.value === 'function'
        ? patchUrl.value(event.data)
        : patchUrl.value
      : postUrl.value
  if (!submitUrl) throw new Error('Submit URL is not set')
  const method = isUpdate && patchUrl.value ? 'PATCH' : 'POST'
  const body =
    isUpdate && patchUrl.value ? getPatchBody.value(event.data) : getPostBody.value(event.data)
  isSubmitting.value = true
  $fetch(submitUrl, {
    method,
    body
  })
    .then(item => {
      toast.add({
        color: 'success',
        title: 'Success',
        description:
          formMode.value === 'create' ? 'Item added successfully' : 'Item updated successfully'
      })
      formOpen.value = false
      selected.value = {}
      refetch()
      if (viewModal.value && viewItem.value) {
        onView(item as T)
      }
    })
    .catch(e => {
      const { message, errors } = parseError(e)
      if (errors?.length) formRef.value?.setErrors(errors)
      else {
        const field = props.fields?.[0]
        formRef.value?.setErrors([
          {
            name: field && 'name' in field ? field.name : 'name',
            message
          }
        ])
      }
    })
    .finally(() => {
      isSubmitting.value = false
    })
}

const { confirm } = useConfirm()
const onDelete = async (item: T | T[]) => {
  if (!deleteUrl.value) throw new Error('Delete URL is not set')
  const url = resolveItemUrl(deleteUrl.value, item)
  const count = Array.isArray(item) ? item.length : 1
  const isPermanent = props.permanentDelete
  const confirmed = await confirm(
    isPermanent
      ? {
          title: 'Delete permanently',
          description:
            count > 1
              ? `Permanently delete ${count} items? This cannot be undone.`
              : 'Permanently delete this item? This cannot be undone.',
          confirmLabel: 'Delete permanently'
        }
      : 'Are you sure you want to delete this item?'
  )
  if (!confirmed) return
  isSubmitting.value = true
  $fetch(url, { method: 'DELETE' })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Success! 🎉',
        description: isPermanent
          ? count > 1
            ? 'Items permanently deleted'
            : 'Item permanently deleted'
          : 'Item deleted successfully'
      })
      refetch()
      viewModal.value = false
    })
    .catch(e => {
      const { message } = parseError(e)
      toast.add({
        color: 'error',
        title: 'Error! 😭',
        description: message
      })
    })
    .finally(() => {
      isSubmitting.value = false
      selected.value = {}
    })
}

const getSelectedRows = () => {
  return table.value?.tableApi?.getFilteredSelectedRowModel().rows ?? []
}

const getSelectedRowItems = () => {
  return getSelectedRows().map(row => row.original)
}

const onDeleteSelected = () => {
  const items = getSelectedRowItems()
  if (!items?.length) return
  onDelete(items)
}

const resolveItemUrl = (
  url: string | ((item: T | T[]) => string),
  item: T | T[]
) => {
  return typeof url === 'function'
    ? url(item)
    : url.replace('{id}', Array.isArray(item) ? item.map(x => x.id).join(',') : item.id)
}

const onRestore = async (item: T | T[]) => {
  if (!restoreUrl.value) throw new Error('Restore URL is not set')
  const url = resolveItemUrl(restoreUrl.value, item)
  const count = Array.isArray(item) ? item.length : 1
  const confirmed = await confirm({
    title: 'Restore',
    description:
      count > 1
        ? `Are you sure you want to restore ${count} items?`
        : 'Are you sure you want to restore this item?',
    confirmLabel: 'Restore',
    confirmColor: 'primary'
  })
  if (!confirmed) return
  isSubmitting.value = true
  $fetch(url, { method: 'POST' })
    .then(() => {
      toast.add({
        color: 'success',
        title: 'Success! 🎉',
        description: count > 1 ? 'Items restored successfully' : 'Item restored successfully'
      })
      refetch()
      viewModal.value = false
    })
    .catch(e => {
      const { message } = parseError(e)
      toast.add({
        color: 'error',
        title: 'Error! 😭',
        description: message
      })
    })
    .finally(() => {
      isSubmitting.value = false
      selected.value = {}
    })
}

const onRestoreSelected = () => {
  const items = getSelectedRowItems()
  if (!items?.length) return
  onRestore(items)
}

const onGotoFirstPage = () => {
  query.value.page = 1
}

watch(
  query,
  v => {
    localStorage.setItem(
      `${getUrl.value}:query`,
      JSON.stringify(
        calendarFormatDates(v, dateFields.value, {
          returnType: 'storage'
        })
      )
    )
  },
  { deep: true }
)

watch(selected, v => {
  localStorage.setItem(`${getUrl.value}:selected`, JSON.stringify(v))
})

type TViewOptions = {
  modal?: Omit<ModalProps, 'portal'>
}

const viewItem = ref<T>()
const viewModal = ref(false)
const viewItems = ref<any[]>([])
const viewProps = ref<TViewOptions>({})

const onView = (item: T, props = viewProps.value) => {
  viewItem.value = item
  viewProps.value = props || {}
  viewItems.value = columns.value
    .filter(v => !(v.id && ['select'].includes(v.id)))
    .map(({ id, accessorKey, header, cell }: any) => {
      const td = cell
        ? typeof cell === 'function'
          ? cell({
              row: { original: item },
              modal: true
            })
          : cell
        : (item as T)[accessorKey as keyof T]
      return {
        id: id || accessorKey,
        tr: id === 'action' ? header || 'Actions' : header,
        td: Array.isArray(td) ? h('div', {}, td) : td
      }
    })
  viewModal.value = true
}

defineExpose({
  onView,
  onAddNew,
  onUpdate,
  onDelete,
  onDeleteSelected,
  onRestore,
  onRestoreSelected,
  refetch
})

// Export
const exportOpen = ref(false)
const exportState = ref({
  format: 'xlsx',
  selection: 'current-page'
})

const { exporting, execute: onExport } = useExport()

const onSubmitExport = async (_values: FormSubmitEvent<typeof exportState.value>) => {
  if (!exportUrl.value) return console.error('Export URL is not set')
  if (
    exportState.value.selection === 'selected' &&
    !table.value?.tableApi?.getFilteredSelectedRowModel().rows.length
  )
    return
  await onExport(exportUrl.value, {
    ...query.value,
    ...exportState.value,
    ...(exportState.value.selection === 'selected'
      ? {
          id: getSelectedRowItems()
            .map((item: unknown) => (item as T).id)
            .join(',')
        }
      : {})
  })
  exportOpen.value = false
}

// Import
const importOpen = ref(false)
const onImportDone = () => {
  refetch()
}
//
</script>

<template>
  <ClientOnly>
    <div class="flex-1 flex flex-col gap-4 overflow-hidden">
      <div class="flex items-center justify-between gap-2 flex-wrap flex-none">
        <div class="flex items-center gap-2 flex-wrap">
          <template
            v-for="row in filters"
            :key="row.name"
          >
            <FilterInputInline
              v-if="row.type === 'inline-input'"
              v-bind="row.props"
              v-model="query[row.name]"
              @update:model-value="onGotoFirstPage"
            />
            <FilterInput
              v-else-if="row.type === 'input'"
              v-bind="row.props"
              v-model="query[row.name]"
              v-model:mode="query[row.name + 'Mode']"
              @update:model-value="onGotoFirstPage"
            />
            <FilterDate
              v-else-if="row.type === 'date'"
              v-bind="row.props"
              v-model="query[row.name]"
              @update:model-value="onGotoFirstPage"
            />
            <FilterCheckbox
              v-else-if="row.type === 'checkbox-api'"
              v-bind="row.props"
              v-model="query[row.name]"
              @update:model-value="onGotoFirstPage"
            />
            <FilterTabs
              v-else-if="row.type === 'tabs'"
              v-bind="row.props"
              v-model="query[row.name]"
              @update:model-value="onGotoFirstPage"
            />
          </template>
          <UTooltip text="Refresh data">
            <UButton
              icon="i-lucide-refresh-cw"
              size="sm"
              color="primary"
              variant="subtle"
              @click="() => refetch()"
            />
          </UTooltip>
          <UTooltip text="Clear filters">
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
          </UTooltip>
          <UTooltip text="Clear Sorting">
            <UButton
              v-if="isOrdered"
              icon="i-lucide-arrow-up-down"
              size="sm"
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
                size="sm"
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
              v-if="restoreUrl"
              label="Restore"
              size="sm"
              color="primary"
              variant="subtle"
              icon="i-lucide-rotate-ccw"
              :ui="{ leadingIcon: 'size-4' }"
              @click="onRestoreSelected"
            >
              <template #trailing>
                <UKbd size="sm">
                  {{ getSelectedRowItems().length }}
                </UKbd>
              </template>
            </UButton>
            <UButton
              v-if="deleteUrl"
              :label="permanentDelete ? 'Delete permanently' : 'Delete'"
              size="sm"
              color="error"
              variant="subtle"
              :icon="permanentDelete ? 'i-lucide-trash-2' : 'i-lucide-trash'"
              :ui="{ leadingIcon: 'size-4' }"
              @click="onDeleteSelected"
            >
              <template #trailing>
                <UKbd size="sm">
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
              <UButton
                icon="i-lucide-download"
                size="sm"
                color="neutral"
                label="Export"
              />
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
                        label: 'Current Page',
                        value: 'current-page'
                      },
                      {
                        label: 'Selected',
                        value: 'selected'
                      },
                      {
                        label: 'All',
                        value: 'all'
                      }
                    ]"
                  />
                </UFormField>
                <UFormField label="Format">
                  <URadioGroup
                    v-model="exportState.format"
                    variant="table"
                    orientation="horizontal"
                    :items="[
                      { label: 'Excel', value: 'xlsx' },
                      { label: 'CSV', value: 'csv' }
                    ]"
                  />
                </UFormField>
                <div class="flex justify-end">
                  <UButton
                    type="submit"
                    size="sm"
                    icon="i-lucide-download"
                    :loading="exporting"
                    :disabled="
                      exportState.selection === 'selected' &&
                      !table?.tableApi?.getFilteredSelectedRowModel().rows.length
                    "
                  >
                    Export
                  </UButton>
                </div>
              </UForm>
            </template>
          </UPopover>
          <UTooltip
            v-if="importConfig"
            :text="importConfig.buttonLabel || 'Bulk Import'"
          >
            <UButton
              icon="i-lucide-upload"
              size="sm"
              color="neutral"
              :label="importConfig.buttonLabel || 'Import'"
              @click="
                () => {
                  importOpen = true
                }
              "
            />
          </UTooltip>
          <slot
            v-if="showAddButton"
            name="actions"
          >
            <UTooltip text="Add new item">
              <UButton
                icon="i-lucide-plus"
                size="sm"
                color="primary"
                variant="solid"
                @click="onAddNew"
              >
                Add New
              </UButton>
            </UTooltip>
          </slot>
        </div>
      </div>
      <slot name="top" />
      <div
        :class="gridClass"
        class="flex-1 overflow-hidden"
      >
        <div
          :class="leftClass"
          class="flex flex-col overflow-hidden"
        >
          <UTable
            ref="table"
            v-model:row-selection="selected"
            class="flex-1"
            :sticky="true"
            :data="data.data"
            :columns="mColumns"
            :loading="isFetching"
            :ui="{
              root: 'scrollbar',
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:after:content-none bg-default',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r data-[pinned=left]:bg-default data-[pinned=right]:bg-default data-[pinned=left]:z-2 data-[pinned=right]:z-2',
              td: 'border-b border-default data-[pinned=left]:bg-default data-[pinned=right]:bg-default data-[pinned=left]:z-1 data-[pinned=right]:z-1',
              separator: 'h-0'
            }"
          >
            <template #select-header="{ column, table }">
              <div class="pr-4">
                <UCheckbox
                  :model-value="
                    table.getIsSomePageRowsSelected()
                      ? 'indeterminate'
                      : table.getIsAllPageRowsSelected()
                  "
                  aria-label="Select all"
                  @update:model-value="v => table.toggleAllPageRowsSelected(!!v)"
                />
              </div>
              {{ !column.getIsPinned() ? column.pin('left') : '' }}
            </template>
            <template #select-cell="{ row }">
              <UCheckbox
                :model-value="row.getIsSelected()"
                aria-label="Select row"
                @update:model-value="v => row.toggleSelected(!!v)"
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
          <div
            class="flex-none flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4"
          >
            <div
              v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
              class="text-sm text-muted"
            >
              {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
              {{ table?.tableApi?.getFilteredRowModel().rows.length || 0 }} row(s) selected.
            </div>
            <div
              v-else
              class="text-sm text-muted"
            >
              Showing {{ query.perPage }} of {{ data.total }} row(s) total
            </div>

            <div class="flex items-center gap-3">
              <UTooltip text="Change items per page">
                <USelect
                  v-model="query.perPage"
                  :items="perPageOptions"
                  size="sm"
                  class="min-w-20"
                  @change="onGotoFirstPage"
                />
              </UTooltip>
              <UPagination
                v-model:page="query.page"
                size="sm"
                :items-per-page="query.perPage"
                :total="data.total"
              />
            </div>
          </div>
        </div>
        <slot name="right" />
      </div>
    </div>
    <UModal
      v-model:open="viewModal"
      title="View Details"
      v-bind="viewProps.modal"
    >
      <template #body>
        <table class="w-full border-collapse text-sm text-left">
          <tbody>
            <tr
              v-for="item in viewItems"
              :key="item.id"
            >
              <th class="border border-default px-4 py-2">{{ item.tr }}</th>
              <td class="border border-default px-4 py-2">
                <div
                  v-if="viewItem && item.id === 'action'"
                  class="flex items-center flex-wrap gap-2"
                >
                  <UButton
                    v-for="action in getActions(viewItem, { view: true }).flat()"
                    :key="action.label"
                    size="sm"
                    variant="subtle"
                    v-bind="action"
                    @click="action.onSelect"
                  />
                </div>
                <component
                  :is="item.td"
                  v-else-if="isVNode(item.td)"
                />
                <template v-else>{{ item.td }}</template>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </UModal>
    <UModal
      v-model:open="formOpen"
      v-bind="modal?.form?.({ mode: formMode })"
    >
      <template #body>
        <UForm
          ref="formRef"
          :state="formState"
          @submit="onSubmit"
        >
          <div
            :class="formClass"
            class="grid grid-cols-1 gap-4"
          >
            <template
              v-for="(row, index) in fields.filter(isFieldVisible)"
              :key="`separator-${index}`"
            >
              <div
                v-if="row.type === 'separator'"
                class="col-span-full"
              >
                <USeparator :label="row.label" />
              </div>
              <UFormField
                v-else
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
                <USelect
                  v-else-if="row.type === 'select'"
                  v-model="formState[row.name]"
                  v-bind="{ ...formItem, ...row.props }"
                />
                <FormAutocomplete
                  v-else-if="row.type === 'autocomplete'"
                  v-model="formState[row.name]"
                  v-bind="{ ...formItem, ...row.props }"
                />
                <FormSelectMenu
                  v-else-if="row.type === 'select-menu'"
                  v-model="formState[row.name]"
                  v-bind="{ ...formItem, ...row.props }"
                />
                <FormUsersPivot
                  v-else-if="row.type === 'team-members'"
                  v-model="formState[row.name]"
                  v-bind="{ ...formItem, ...row.props }"
                />
                <FormAttachments
                  v-else-if="row.type === 'attachments'"
                  v-model="formState[row.name]"
                  :folder="row.props?.folder"
                  :attachable-id="formState.attachableId"
                  :attachable-model-id="formState.id"
                  :attachable-model-type="row.props?.attachableModelType"
                />
              </UFormField>
            </template>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex justify-end gap-2 flex-1">
          <UButton
            icon="i-lucide-x"
            type="button"
            color="error"
            variant="subtle"
            @click="formOpen = false"
          >
            Cancel
          </UButton>
          <UButton
            type="button"
            :loading="isSubmitting"
            icon="i-lucide-send"
            @click="formRef?.submit()"
          >
            Submit
          </UButton>
        </div>
      </template>
    </UModal>
    <BaseImportModal
      v-if="importConfig"
      v-model:open="importOpen"
      :title="importConfig.title"
      :description="importConfig.description"
      :import-url="importConfig.importUrl"
      :example-url="importConfig.exampleUrl"
      :entity-label="importConfig.entityLabel"
      :dropzone-description="importConfig.dropzoneDescription"
      :failed-columns="importConfig.failedColumns"
      @success="onImportDone"
      @failed="onImportDone"
    />
  </ClientOnly>
</template>
