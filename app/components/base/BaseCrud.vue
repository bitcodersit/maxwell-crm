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
import type { TSelectMenuProps } from './BaseSelectMenu.vue'

export type TColumn<T extends TableData, D = unknown> = TableColumn<T, D> & {
  pinned?: 'left' | 'right'
  sortBy?: string
}

export type TFilter = { id: string } & (
  | ({ type: 'input' } & TInputFilterProps)
  | ({ type: 'select' } & SelectProps)
)

export type TField = { id: string; label: string } & (
  | ({ type: 'input' } & InputProps)
  | ({ type: 'textarea' } & TextareaProps)
  | ({ type: 'select' } & TSelectMenuProps)
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
    getActions?: (item: T) => DropdownMenuItem[][]
    getFormState?: (item?: T) => TFormState
    getPostBody?: (state: TFormState) => object | FormData
  }>(),
  {
    sticky: true,
    enableRowSelection: true,
    fields: () => [],
    filters: () => [],
    columns: () => [],
    getActions: () => [],
    getFormState: (v?: T) => ({ ...(v ?? {}) }),
    perPageOptions: () => [5, 10, 20, 30, 40, 50, 100],
    getPostBody: (state: TFormState) => state,
  }
)

const def = toPaginated<T>()
const table = useTemplateRef('table')
const selected = ref<Record<string, boolean>>({})

const initialQuery = {
  page: def.page,
  perPage: def.perPage,
  orderBy: {},
}

const initialKeys = Object.keys(initialQuery)
const query = reactive<TQuery>({
  ...initialQuery,
})

const { getUrl, columns, filters, postUrl, getFormState, formModal, getPostBody } = toRefs(props)
const { data, status, refresh } = useFetch<TPaginated<T>>(getUrl, {
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

defineExpose({
  onUpdate,
  onDelete,
  onDeleteSelected,
})
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
        color="error"
        variant="subtle"
        @click="onClearFilters"
      >
        Clear
      </UButton>
      <UButton
        v-if="Object.keys(query.orderBy).length"
        icon="i-lucide-arrow-up-down"
        color="error"
        variant="subtle"
        @click="onClearOrderBy"
      >
        Clear
      </UButton>
    </div>
    <div class="flex items-center gap-2">
      <slot
        name="bulk-actions"
        v-if="table?.tableApi?.getFilteredSelectedRowModel().rows.length"
        v-bind="{
          count: table?.tableApi?.getFilteredSelectedRowModel().rows.length,
          selected,
        }"
      />
      <UButton icon="i-lucide-plus" color="primary" variant="solid" @click="onAddNew">
        Add New
      </UButton>
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
      <USelect
        v-model="query.perPage"
        :items="perPageOptions"
        class="min-w-20"
        @change="() => (query.page = 1)"
      />
      <UPagination v-model:page="query.page" :items-per-page="query.perPage" :total="data.total" />
    </div>
  </div>
  <UModal
    v-model:open="formOpen"
    :title="formModal?.[formMode]?.title"
    :description="formModal?.[formMode]?.description"
  >
    <template #body>
      <UForm ref="formRef" :state="formState" class="space-y-4" @submit="onSubmit">
        <template v-for="row in fields" :key="row.id">
          <UFormField :name="row.id" :label="row.label">
            <UInput
              v-if="row.type === 'input'"
              v-model="formState[row.id]"
              class="w-full"
              size="xl"
            />
            <UTextarea
              v-else-if="row.type === 'textarea'"
              v-model="formState[row.id]"
              class="w-full"
              size="xl"
            />
            <BaseSelectMenu
              v-else-if="row.type === 'select'"
              v-model="formState[row.id]"
              v-bind="row"
            />
          </UFormField>
        </template>
        <div class="flex justify-end gap-2">
          <UButton type="button" color="neutral" variant="subtle" @click="formOpen = false">
            Cancel
          </UButton>
          <UButton type="submit" :loading="isSubmitting"> Submit </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
