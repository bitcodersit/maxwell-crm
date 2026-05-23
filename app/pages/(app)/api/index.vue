<script setup lang="ts">
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type SavedRequest = {
  id: string
  method: HttpMethod
  endpoint: string
  fields: Array<{
    id: string
    name: string
    value: string
  }>
  createdAt: number
}

definePageMeta({ title: 'API Client' })

const STORAGE_KEY = 'api-client-history'
const MAX_HISTORY = 100

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const method = ref<HttpMethod>('GET')
const endpoint = ref('/api/me')
const fields = ref<SavedRequest['fields']>([{ id: crypto.randomUUID(), name: '', value: '' }])
const files = ref<File[]>([])
const response = ref('')
const error = ref('')
const loading = ref(false)
const selectedHistoryId = ref<string>()

const history = useLocalStorage<SavedRequest[]>(STORAGE_KEY, [])

const historyOptions = computed(() =>
  history.value.map(request => ({
    label: `${request.method} - ${request.endpoint}`.substring(0, 100),
    value: request.id
  }))
)

const payloadHint = computed(() =>
  method.value === 'GET' || method.value === 'DELETE'
    ? 'Fields are sent as query parameters. Files are disabled for this method.'
    : 'Fields are sent as request body. Add files to send multipart/form-data.'
)

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function formatError(err: unknown) {
  if (err instanceof SyntaxError) {
    return `Invalid JSON: ${err.message}`
  }

  if (err && typeof err === 'object' && 'data' in err) {
    const fetchError = err as {
      statusCode?: number
      statusMessage?: string
      data?: unknown
      message?: string
    }

    const parts = [
      fetchError.statusCode
        ? `${fetchError.statusCode} ${fetchError.statusMessage ?? ''}`.trim()
        : null,
      fetchError.data !== undefined ? formatJson(fetchError.data) : null,
      fetchError.message
    ].filter(Boolean)

    return parts.join('\n\n')
  }

  if (err instanceof Error) {
    return err.message
  }

  return formatJson(err)
}

function loadRequest(request: SavedRequest) {
  method.value = request.method
  endpoint.value = request.endpoint
  fields.value = request.fields.length
    ? request.fields.map(field => ({
        id: crypto.randomUUID(),
        name: field.name,
        value: field.value
      }))
    : [{ id: crypto.randomUUID(), name: '', value: '' }]
  files.value = []
}

function parseHistoryEntry(
  entry: SavedRequest | (Omit<SavedRequest, 'fields'> & { payload?: string })
) {
  if ('fields' in entry && Array.isArray(entry.fields)) {
    return {
      ...entry,
      fields: entry.fields.map(field => ({
        id: field.id || crypto.randomUUID(),
        name: field.name ?? '',
        value: field.value ?? ''
      }))
    } satisfies SavedRequest
  }

  let parsedPayload: unknown = {}
  const legacyPayload = 'payload' in entry ? entry.payload : undefined
  if (legacyPayload) {
    try {
      parsedPayload = JSON.parse(legacyPayload)
    } catch {
      parsedPayload = {}
    }
  }

  const parsedFields =
    parsedPayload && typeof parsedPayload === 'object'
      ? Object.entries(parsedPayload as Record<string, unknown>).map(([name, value]) => ({
          id: crypto.randomUUID(),
          name,
          value: typeof value === 'string' ? value : formatJson(value)
        }))
      : []

  return {
    id: entry.id,
    method: entry.method,
    endpoint: entry.endpoint,
    fields: parsedFields.length ? parsedFields : [{ id: crypto.randomUUID(), name: '', value: '' }],
    createdAt: entry.createdAt
  } satisfies SavedRequest
}

function buildPayloadObject() {
  const payload: Record<string, unknown> = {}

  for (const field of fields.value) {
    const name = field.name.trim()
    if (!name) continue

    const trimmedValue = field.value.trim()
    if (!trimmedValue) {
      payload[name] = ''
      continue
    }

    try {
      payload[name] = JSON.parse(trimmedValue)
    } catch {
      payload[name] = field.value
    }
  }

  return payload
}

function addField() {
  fields.value.push({ id: crypto.randomUUID(), name: '', value: '' })
}

function removeField(fieldId: string) {
  fields.value = fields.value.filter(field => field.id !== fieldId)
  if (!fields.value.length) {
    addField()
  }
}

function onFilesChange(event: Event) {
  const target = event.target as HTMLInputElement
  files.value = target.files ? Array.from(target.files) : []
}

function saveRequest() {
  const request: SavedRequest = {
    id: crypto.randomUUID(),
    method: method.value,
    endpoint: endpoint.value,
    fields: fields.value.map(field => ({
      id: field.id,
      name: field.name,
      value: field.value
    })),
    createdAt: Date.now()
  }

  history.value = [
    request,
    ...history.value.filter(item => item.endpoint.trim() !== request.endpoint.trim())
  ].slice(0, MAX_HISTORY)
  selectedHistoryId.value = request.id
}

function onHistorySelect(id: string | undefined) {
  if (!id) {
    return
  }

  const request = history.value.find(item => item.id === id)
  if (request) {
    loadRequest(request)
  }
}

async function sendRequest() {
  loading.value = true
  response.value = ''
  error.value = ''

  try {
    const parsed = buildPayloadObject()
    const hasPayload = Object.keys(parsed).length > 0

    const options: Parameters<typeof $fetch>[1] = {
      method: method.value
    }

    const hasFiles = files.value.length > 0

    if (hasFiles && (method.value === 'GET' || method.value === 'DELETE')) {
      throw new Error('Files can only be sent with POST, PUT or PATCH.')
    }

    if (hasFiles) {
      const form = new FormData()

      for (const [name, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          form.append(name, value)
        } else {
          form.append(name, formatJson(value))
        }
      }

      for (const file of files.value) {
        form.append('files', file, file.name)
      }

      options.body = form
    } else if (hasPayload) {
      if (method.value === 'GET' || method.value === 'DELETE') {
        options.query = parsed
      } else {
        options.body = parsed
      }
    }

    const result = await $fetch(endpoint.value, options)
    response.value = formatJson(result)
    saveRequest()
  } catch (err) {
    error.value = formatError(err)
    saveRequest()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  history.value = history.value.map(item => parseHistoryEntry(item as SavedRequest))

  const latest = history.value[0]
  if (latest) {
    loadRequest(latest)
    selectedHistoryId.value = latest.id
  }
})
</script>

<template>
  <div class="grid grid-cols-2 gap-4 flex-1">
    <div>
      <UPageCard
        variant="subtle"
        class="flex flex-col gap-4"
      >
        <UFormField label="History">
          <USelect
            v-model="selectedHistoryId"
            :items="historyOptions"
            placeholder="Select a previous request"
            class="w-full"
            @update:model-value="onHistorySelect"
          />
        </UFormField>
        <div class="flex flex-col sm:flex-row gap-3">
          <UFormField
            label="Method"
            class="sm:w-36"
          >
            <USelect
              v-model="method"
              :items="methods"
              class="w-full"
            />
          </UFormField>
          <UFormField
            label="Endpoint"
            class="flex-1"
          >
            <UInput
              v-model="endpoint"
              placeholder="/api/options"
              class="w-full font-mono"
            />
          </UFormField>
        </div>
        <UFormField
          label="Body / Query Fields"
          :description="payloadHint"
        >
          <div class="flex flex-col gap-2">
            <div
              v-for="field in fields"
              :key="field.id"
              class="grid grid-cols-[1fr_1fr_auto] gap-2"
            >
              <UInput
                v-model="field.name"
                placeholder="name"
                class="font-mono"
              />
              <UInput
                v-model="field.value"
                placeholder="value"
                class="font-mono"
              />
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-trash-2"
                :disabled="fields.length === 1"
                @click="removeField(field.id)"
              />
            </div>
            <div>
              <UButton
                color="neutral"
                variant="outline"
                icon="i-lucide-plus"
                label="Add field"
                @click="addField"
              />
            </div>
          </div>
        </UFormField>
        <UFormField
          label="Files"
          description="Files are sent as multipart with field name 'files'."
        >
          <UInput
            :disabled="method === 'GET' || method === 'DELETE'"
            type="file"
            multiple
            class="w-full text-sm"
            @change="onFilesChange"
          />
        </UFormField>
        <div>
          <UButton
            label="Send request"
            icon="i-lucide-send"
            :loading="loading"
            @click="sendRequest"
          />
        </div>
      </UPageCard>
    </div>
    <div class="flex flex-col gap-4">
      <UPageCard
        variant="subtle"
        class="flex flex-col gap-3"
      >
        <div class="font-medium text-highlighted">Response</div>
        <pre
          class="min-h-48 max-h-96 overflow-auto rounded-md bg-elevated p-4 text-sm font-mono whitespace-pre-wrap wrap-break-word"
          >{{ response || '—' }}</pre
        >
      </UPageCard>
      <UPageCard
        variant="subtle"
        class="flex flex-col gap-3"
      >
        <div class="font-medium text-error">Error</div>
        <pre
          class="min-h-48 max-h-96 overflow-auto rounded-md bg-elevated p-4 text-sm font-mono text-error whitespace-pre-wrap wrap-break-word"
          >{{ error || '—' }}</pre
        >
      </UPageCard>
    </div>
  </div>
</template>
