<script setup lang="ts">
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

type SavedRequest = {
  id: string
  method: HttpMethod
  endpoint: string
  payload: string
  createdAt: number
}

definePageMeta({ title: 'API Client' })

const STORAGE_KEY = 'api-client-history'
const MAX_HISTORY = 100

const methods: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']

const method = ref<HttpMethod>('GET')
const endpoint = ref('/api/me')
const payload = ref('{}')
const response = ref('')
const error = ref('')
const loading = ref(false)
const selectedHistoryId = ref<string>()

const history = useLocalStorage<SavedRequest[]>(STORAGE_KEY, [])

const historyOptions = computed(() =>
  history.value.map(request => ({
    label: `${request.method} - ${request.endpoint} - ${request.payload}`.substring(0, 100),
    value: request.id
  }))
)

const payloadHint = computed(() =>
  method.value === 'GET' || method.value === 'DELETE'
    ? 'Parsed JSON is sent as query parameters.'
    : 'Parsed JSON is sent as the request body.'
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
  payload.value = request.payload
}

function saveRequest() {
  const request: SavedRequest = {
    id: crypto.randomUUID(),
    method: method.value,
    endpoint: endpoint.value,
    payload: payload.value,
    createdAt: Date.now()
  }

  const latest = history.value[0]
  if (
    latest &&
    latest.method === request.method &&
    latest.endpoint === request.endpoint &&
    latest.payload === request.payload
  ) {
    selectedHistoryId.value = latest.id
    return
  }

  history.value = [request, ...history.value].slice(0, MAX_HISTORY)
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
    let parsed: unknown
    const trimmed = payload.value.trim()

    if (trimmed) {
      parsed = JSON.parse(trimmed)
    }

    const options: Parameters<typeof $fetch>[1] = {
      method: method.value
    }

    if (parsed !== undefined) {
      if (method.value === 'GET' || method.value === 'DELETE') {
        options.query = parsed as Record<string, unknown>
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
          label="Body / Query (JSON)"
          :description="payloadHint"
        >
          <UTextarea
            v-model="payload"
            :rows="8"
            class="w-full font-mono"
            placeholder='{ "key": "value" }'
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
