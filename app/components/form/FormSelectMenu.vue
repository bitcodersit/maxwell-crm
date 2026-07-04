<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    api: string
    query?: Record<string, any>
    labelKey?: string
    placeholder?: string
    size?: string
    class?: any
    icon?: string
    clear?: boolean | object
    disabled?: boolean
  }>(),
  {
    icon: 'i-lucide-search',
    labelKey: 'name',
    clear: true
  }
)

const model = defineModel<any>()
const open = ref(false)

const searchTerm = ref('')
const searchTermDebounced = refDebounced(searchTerm, 300)

const queryKey = computed(() => {
  return [props.api, props.query, searchTermDebounced.value] as const
})

const { data, isFetching } = useQuery({
  enabled: computed(() => open.value),
  queryKey,
  initialData: () => toPaginated<any>(),
  queryFn: ({ queryKey: [api, query, q] }) => {
    return $fetch<TPaginated<any>>(api, {
      query: {
        ...query,
        ...(q ? { q } : {})
      }
    })
  }
})

const items = computed(() => data.value.data || [])

// Keep the selected item in the list so its label can render after select
const menuItems = computed(() => {
  const rows = [...items.value]
  const selected = model.value
  if (!selected || typeof selected !== 'object' || selected.id == null) return rows
  if (rows.some(row => row?.id === selected.id)) return rows
  return [selected, ...rows]
})
</script>

<template>
  <UInputMenu
    v-model="model"
    v-model:open="open"
    v-model:search-term="searchTerm"
    :items="menuItems"
    :loading="isFetching"
    :clear="clear"
    :size="size"
    :class="props.class"
    :icon="icon"
    :label-key="labelKey"
    :placeholder="placeholder"
    :disabled="disabled"
    by="id"
    :open-on-focus="true"
    :open-on-click="true"
    :ignore-filter="true"
    :reset-search-term-on-blur="false"
    :reset-model-value-on-clear="true"
  />
</template>
