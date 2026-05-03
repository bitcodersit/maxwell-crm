<script setup lang="ts">
import type { FormSubmitEvent, TableColumn } from '@nuxt/ui'
import { getPaginationRowModel } from '@tanstack/table-core'
import { h, watch } from 'vue'

/** Row shape from list APIs; modules supply typed columns from outside. */
type CrudRow = Record<string, unknown>

const props = withDefaults(
  defineProps<{
    title: string
    listUrl: string
    saveUrl: string
    columns: TableColumn<CrudRow>[]
    /** Zod object schema (e.g. `z.object({ ... })`) for UForm */
    formSchema: unknown
    defaultFormState: Record<string, unknown>
    rowIdKey?: string
    mapRowToForm?: (row: CrudRow) => Record<string, unknown>
    transformBody?: (
      data: Record<string, unknown>,
      mode: 'create' | 'update',
      id: number | null
    ) => Record<string, unknown>
    enableRowSelection?: boolean
    enableSearch?: boolean
    searchPlaceholder?: string
    perPageOptions?: number[]
    createButtonLabel?: string
    createModalTitle?: string
    editModalTitle?: string
    saveMethod?: 'POST' | 'PUT'
  }>(),
  {
    rowIdKey: 'id',
    enableRowSelection: true,
    enableSearch: true,
    searchPlaceholder: 'Search…',
    perPageOptions: () => [10, 25, 50],
    createButtonLabel: 'Add',
    saveMethod: 'POST',
  },
)

const emit = defineEmits<{
  saved: [payload: { mode: 'create' | 'update'; body: Record<string, unknown>; response: unknown }]
  fetchError: [error: unknown]
}>()

defineSlots<{
  form: (props: {
    state: Record<string, unknown>
    mode: 'create' | 'update'
  }) => void
  'bulk-actions': (props: {
    selectedIds: number[]
    selectedRows: CrudRow[]
    clearSelection: () => void
  }) => void
  'toolbar-extra': () => void
}>()

const toast = useToast()

const page = ref(1)
const perPage = ref(props.perPageOptions[0] ?? 10)

watch(perPage, () => {
  page.value = 1
})

const searchInput = ref('')
const debouncedQ = ref('')
const debouncedSet = useDebounceFn((value: string) => {
  debouncedQ.value = value
  page.value = 1
}, 350)

watch(searchInput, (v) => debouncedSet(v))

const queryParams = computed(() => ({
  page: page.value,
  perPage: perPage.value,
  ...(debouncedQ.value.trim() ? { q: debouncedQ.value.trim() } : {}),
}))

const {
  data: paginated,
  status,
  refresh,
  error,
} = await useFetch(() => props.listUrl, {
  query: queryParams,
})

watch(error, (e) => {
  if (e) emit('fetchError', e)
})

function paginatedPayload() {
  return paginated.value as TPaginated<CrudRow> | null | undefined
}

const rows = computed(() => paginatedPayload()?.data ?? [])
const totalRows = computed(() => paginatedPayload()?.total ?? 0)

const table = useTemplateRef('table')

const columnVisibility = ref()
const rowSelection = ref<Record<string, boolean>>({})

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
})

watch(
  () => rows.value.length,
  (len) => {
    const size = Math.max(len, 1)
    pagination.value = { pageIndex: 0, pageSize: size }
  },
  { immediate: true },
)

watch(
  () => [page.value, perPage.value, debouncedQ.value] as const,
  () => {
    rowSelection.value = {}
  },
)

const UCheckbox = resolveComponent('UCheckbox')

const mergedColumns = computed((): TableColumn<CrudRow>[] => {
  if (!props.enableRowSelection) {
    return props.columns
  }

  const selectCol: TableColumn<CrudRow> = {
    id: '_select',
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? 'indeterminate'
          : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          table.toggleAllPageRowsSelected(!!value),
        ariaLabel: 'Select all',
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
          row.toggleSelected(!!value),
        ariaLabel: 'Select row',
      }),
  }

  return [selectCol, ...props.columns]
})

const formOpen = ref(false)
const formMode = ref<'create' | 'update'>('create')
const editingId = ref<number | null>(null)
const saving = ref(false)

const formState = reactive<Record<string, unknown>>({})

function cloneDefaults() {
  return JSON.parse(JSON.stringify(props.defaultFormState)) as Record<string, unknown>
}

function resetFormState() {
  const next = cloneDefaults()
  Object.keys(formState).forEach((k) => {
    delete formState[k]
  })
  Object.assign(formState, next)
}

function setFormState(partial: Record<string, unknown>) {
  Object.keys(formState).forEach((k) => {
    delete formState[k]
  })
  Object.assign(formState, partial)
}

const modalTitle = computed(() => {
  if (formMode.value === 'create') {
    return props.createModalTitle ?? `New ${props.title}`
  }
  return props.editModalTitle ?? `Edit ${props.title}`
})

function openCreate() {
  formMode.value = 'create'
  editingId.value = null
  resetFormState()
  formOpen.value = true
}

function openEdit(row: CrudRow) {
  formMode.value = 'update'
  const idVal = row[props.rowIdKey]
  editingId.value = typeof idVal === 'number' ? idVal : Number(idVal)
  const mapped = props.mapRowToForm ? props.mapRowToForm(row) : { ...row }
  setFormState(mapped as Record<string, unknown>)
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
}

async function onSubmit(event: FormSubmitEvent<unknown>) {
  saving.value = true
  try {
    const data = event.data as Record<string, unknown>

    const body = props.transformBody
      ? props.transformBody(data, formMode.value, editingId.value)
      : formMode.value === 'update' && editingId.value != null
        ? { ...data, id: editingId.value }
        : { ...data }

    const response = await $fetch<unknown>(props.saveUrl, {
      method: props.saveMethod,
      body,
    })

    emit('saved', { mode: formMode.value, body, response })

    toast.add({
      title: formMode.value === 'create' ? 'Created' : 'Updated',
      icon: 'i-lucide-check',
      color: 'success',
    })

    formOpen.value = false
    await refresh()
    rowSelection.value = {}
  } catch (e: any) {
    const msg =
      e?.data?.message ??
      e?.data?.statusMessage ??
      e?.message ??
      'Request failed'
    toast.add({
      title: 'Error',
      description: typeof msg === 'string' ? msg : 'Request failed',
      color: 'error',
    })
  } finally {
    saving.value = false
  }
}

function selectedRowsModel(): CrudRow[] {
  const api = table.value?.tableApi
  if (!api) return []
  return api.getFilteredSelectedRowModel().rows.map((r) => r.original as CrudRow)
}

const idKey = computed(() => props.rowIdKey)

const selectedRowsList = computed(() => selectedRowsModel())

const bulkSelectedIds = computed(() =>
  selectedRowsList.value
    .map((row) => row[idKey.value])
    .filter((id): id is number => typeof id === 'number'),
)

function getRowPk(row: CrudRow) {
  return String(row[props.rowIdKey])
}

function clearSelection() {
  rowSelection.value = {}
  table.value?.tableApi?.resetRowSelection?.()
}

defineExpose({
  refresh,
  openCreate,
  openEdit,
  closeForm,
})
</script>

<template>
  <UDashboardPanel :id="title.toLowerCase().replace(/\s+/g, '-')">
    <template #header>
      <UDashboardNavbar :title="title">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <slot name="toolbar-extra" />
          <UButton
            :label="createButtonLabel"
            icon="i-lucide-plus"
            color="primary"
            @click="openCreate"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div class="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <UInput
            v-if="enableSearch"
            v-model="searchInput"
            class="max-w-sm"
            icon="i-lucide-search"
            :placeholder="searchPlaceholder"
          />

          <USelect
            v-model="perPage"
            :items="perPageOptions"
            class="min-w-36"
          />
        </div>

        <div
          v-if="$slots['bulk-actions'] && enableRowSelection && bulkSelectedIds.length"
          class="flex flex-wrap items-center gap-2"
        >
          <slot
            name="bulk-actions"
            :selected-ids="bulkSelectedIds"
            :selected-rows="selectedRowsList"
            :clear-selection="clearSelection"
          />
        </div>
      </div>

      <UTable
        ref="table"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :get-row-id="getRowPk"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        class="shrink-0"
        :data="rows"
        :columns="mergedColumns"
        :loading="status === 'pending'"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
          separator: 'h-0',
        }"
      />

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-default pt-4 mt-4">
        <div
          v-if="enableRowSelection"
          class="text-sm text-muted"
        >
          {{ table?.tableApi?.getFilteredSelectedRowModel().rows.length || 0 }} of
          {{ rows.length }} row(s) selected on this page.
        </div>
        <div v-else class="text-sm text-muted">
          {{ totalRows }} row(s) total
        </div>

        <UPagination
          v-model:page="page"
          :items-per-page="perPage"
          :total="totalRows"
        />
      </div>

      <UModal
        v-model:open="formOpen"
        :title="modalTitle"
        :description="formMode === 'create' ? undefined : `ID #${editingId}`"
      >
        <template #body>
          <UForm
            :schema="formSchema as never"
            :state="formState as any"
            class="space-y-4"
            @submit="onSubmit"
          >
            <slot
              name="form"
              :state="formState"
              :mode="formMode"
            />

            <div class="flex justify-end gap-2 pt-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="subtle"
                :disabled="saving"
                @click="closeForm"
              />
              <UButton
                type="submit"
                color="primary"
                :label="formMode === 'create' ? 'Create' : 'Save'"
                :loading="saving"
              />
            </div>
          </UForm>
        </template>
      </UModal>
    </template>
  </UDashboardPanel>
</template>
