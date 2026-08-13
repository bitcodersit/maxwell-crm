<script setup lang="ts">
export type TImportFailedRow = {
  row: number
  errors: string[]
  [key: string]: unknown
}

export type TImportResult = {
  imported: number
  failed: TImportFailedRow[]
  total: number
}

export type TImportFailedColumn = {
  key: string
  label: string
}

const open = defineModel<boolean>('open', { default: false })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    importUrl: string
    exampleUrl: string
    entityLabel?: string
    dropzoneDescription?: string
    failedColumns?: TImportFailedColumn[]
  }>(),
  {
    title: 'Bulk Import',
    description: 'Upload a CSV or Excel file to import multiple rows at once',
    entityLabel: 'item',
    dropzoneDescription: 'CSV or Excel (.xlsx, .xls) — one row per record',
    failedColumns: () => [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' }
    ]
  }
)

const emit = defineEmits<{
  success: [result: TImportResult]
  failed: [result: TImportResult]
}>()

const toast = useToast()
const file = ref<File | null>(null)
const importing = ref(false)
const failedOpen = ref(false)
const failedRows = ref<TImportFailedRow[]>([])
const importSummary = ref({ imported: 0, total: 0 })

const accept =
  '.csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

watch(open, value => {
  if (!value) {
    file.value = null
    importing.value = false
  }
})

const downloadExample = (format: 'xlsx' | 'csv' = 'xlsx') => {
  const separator = props.exampleUrl.includes('?') ? '&' : '?'
  window.open(`${props.exampleUrl}${separator}format=${format}`, '_blank')
}

const onImport = async () => {
  if (!file.value) {
    toast.add({
      title: 'Select a file',
      description: 'Please choose a CSV or Excel file to import',
      color: 'warning'
    })
    return
  }

  importing.value = true
  try {
    const body = new FormData()
    body.append('file', file.value)

    const result = await $fetch<TImportResult>(props.importUrl, {
      method: 'POST',
      body
    })

    if (result.failed.length) {
      importSummary.value = { imported: result.imported, total: result.total }
      failedRows.value = result.failed
      open.value = false
      failedOpen.value = true
      emit('failed', result)
      return
    }

    open.value = false
    toast.add({
      title: 'Import successful',
      description: `${result.imported} ${props.entityLabel}${result.imported === 1 ? '' : 's'} imported`,
      color: 'success'
    })
    emit('success', result)
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      title: 'Import failed',
      description: message,
      color: 'error'
    })
  } finally {
    importing.value = false
  }
}

const cellValue = (row: TImportFailedRow, key: string) => {
  const value = row[key]
  if (value == null || value === '') return '—'
  return String(value)
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <div class="space-y-4">
        <UFileUpload
          v-model="file"
          :accept="accept"
          icon="i-lucide-file-spreadsheet"
          layout="list"
          position="inside"
          label="Drop your file here"
          :description="dropzoneDescription"
          class="w-full min-h-40"
          size="lg"
        />

        <div class="flex items-center justify-between gap-3">
          <UButton
            label="Download example format"
            color="primary"
            variant="link"
            size="xs"
            icon="i-lucide-download"
            class="px-0"
            @click="downloadExample('xlsx')"
          />
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2 w-full">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          :disabled="importing"
          @click="
            () => {
              open = false
            }
          "
        />
        <UButton
          label="Import"
          icon="i-lucide-upload"
          color="primary"
          :loading="importing"
          :disabled="!file"
          @click="onImport"
        />
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="failedOpen"
    title="Some rows failed to import"
    :description="`${importSummary.imported} of ${importSummary.total} imported. Review the failed rows below.`"
    :ui="{ content: 'max-w-3xl' }"
  >
    <template #body>
      <div class="overflow-auto max-h-80 rounded-lg border border-default">
        <table class="w-full text-sm">
          <thead class="bg-elevated sticky top-0">
            <tr class="text-left">
              <th class="px-3 py-2 font-medium">Row</th>
              <th
                v-for="column in failedColumns"
                :key="column.key"
                class="px-3 py-2 font-medium"
              >
                {{ column.label }}
              </th>
              <th class="px-3 py-2 font-medium">Errors</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in failedRows"
              :key="row.row"
              class="border-t border-default align-top"
            >
              <td class="px-3 py-2 text-muted whitespace-nowrap">{{ row.row }}</td>
              <td
                v-for="column in failedColumns"
                :key="column.key"
                class="px-3 py-2"
              >
                {{ cellValue(row, column.key) }}
              </td>
              <td class="px-3 py-2 text-error">
                <ul class="list-disc pl-4 space-y-0.5">
                  <li
                    v-for="(error, index) in row.errors"
                    :key="index"
                  >
                    {{ error }}
                  </li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end w-full">
        <UButton
          label="Close"
          color="neutral"
          variant="subtle"
          @click="
            () => {
              failedOpen = false
            }
          "
        />
      </div>
    </template>
  </UModal>
</template>
