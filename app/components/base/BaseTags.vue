<script setup lang="ts">
export type TBaseTagsItem = Record<string, any>
export type TBaseTagsProps = {
  api: string
  placeholder?: string
  max?: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  valueKey?: string
  labelKey?: string
}

const props = withDefaults(defineProps<TBaseTagsProps>(), {
  size: 'xl',
  valueKey: 'id',
  labelKey: 'name',
})

const model = defineModel<TBaseTagsItem[]>({ default: () => [] })

const searchTerm = ref('')
const dropdownOpen = ref(false)
const activeIndex = ref(0)
const debouncedSearchTerm = refDebounced(searchTerm, 200)
const queryKey = computed(() => debouncedSearchTerm.value.trim().toLowerCase())
const queryCache = ref<Record<string, TBaseTagsItem[]>>({})
const fetchedQueries = ref<Record<string, true>>({})

const { data, status, execute } = useLazyFetch<TPaginated<TBaseTagsItem>>(() => props.api, {
  server: false,
  immediate: false,
  query: computed(() => {
    const q = debouncedSearchTerm.value.trim()
    return { q: q || undefined }
  }),
  default: () => toPaginated<TBaseTagsItem>(),
})

const getItemKey = (item: TBaseTagsItem) => item?.[props.valueKey]
const getItemLabel = (item: TBaseTagsItem) => String(item?.[props.labelKey] ?? '')
const convertByKeys = (value: string) => ({
  [props.valueKey]: Number(value),
  [props.labelKey]: value,
})

const currentRows = computed(() => {
  const key = queryKey.value
  return queryCache.value[key] ?? data.value?.data ?? []
})

const selectableItems = computed(() => {
  const rows = currentRows.value
  const selected = new Set(model.value.map((x) => getItemKey(x)))
  return rows.filter((row) => !selected.has(getItemKey(row)))
})

const fetchForCurrentQuery = async () => {
  const key = queryKey.value
  if (fetchedQueries.value[key]) return

  await execute()
  queryCache.value[key] = data.value?.data ?? []
  fetchedQueries.value[key] = true
}

watch(debouncedSearchTerm, async () => {
  if (!dropdownOpen.value) return
  activeIndex.value = 0
  await fetchForCurrentQuery()
})

watch(selectableItems, (list) => {
  if (!list.length) {
    activeIndex.value = 0
    return
  }
  if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
})

const inputTagsRef = useTemplateRef<{ inputRef: HTMLInputElement | null }>('inputTagsRef')
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const panelRef = useTemplateRef<HTMLElement>('panelRef')

const popoverReference = computed(() => rootRef.value ?? undefined)

const onOpenAutoFocus = (event: Event) => {
  event.preventDefault()
}

onClickOutside(
  rootRef,
  () => {
    dropdownOpen.value = false
  },
  { ignore: [panelRef] }
)

watch(dropdownOpen, async (open) => {
  if (!open) return
  await nextTick()
  const input = inputTagsRef.value?.inputRef
  if (!input) return
  if (document.activeElement !== input) {
    input.focus({ preventScroll: true })
  }
})

function selectItem(item: TBaseTagsItem) {
  if (props.max != null && model.value.length >= props.max) return
  if (model.value.some((x) => getItemKey(x) === getItemKey(item))) return
  model.value = [...model.value, item]
  searchTerm.value = ''
  const input = inputTagsRef.value?.inputRef
  if (input) {
    input.value = ''
    input.focus({ preventScroll: true })
  }
  dropdownOpen.value = true
  activeIndex.value = 0
}

watchEffect((onCleanup) => {
  const el = inputTagsRef.value?.inputRef
  if (!el) return

  const onInput = (e: Event) => {
    const v = (e.target as HTMLInputElement).value
    searchTerm.value = v
    dropdownOpen.value = true
  }

  const onFocus = async () => {
    dropdownOpen.value = true
    activeIndex.value = 0
    await fetchForCurrentQuery()
  }

  const onKeydown = (e: KeyboardEvent) => {
    if (e.isComposing) return

    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      e.stopPropagation()
      if (
        e.key === 'Enter' &&
        dropdownOpen.value &&
        status.value !== 'pending' &&
        selectableItems.value.length
      ) {
        const item = selectableItems.value[activeIndex.value]
        if (item) selectItem(item)
      }
      return
    }

    if (e.key === 'Escape' && dropdownOpen.value) {
      e.preventDefault()
      e.stopPropagation()
      dropdownOpen.value = false
      return
    }

    if (!dropdownOpen.value || status.value === 'pending' || !selectableItems.value.length) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      e.stopPropagation()
      activeIndex.value = Math.min(activeIndex.value + 1, selectableItems.value.length - 1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      e.stopPropagation()
      activeIndex.value = Math.max(activeIndex.value - 1, 0)
    }
  }

  el.addEventListener('input', onInput)
  el.addEventListener('focus', onFocus)
  el.addEventListener('keydown', onKeydown, true)
  onCleanup(() => {
    el.removeEventListener('input', onInput)
    el.removeEventListener('focus', onFocus)
    el.removeEventListener('keydown', onKeydown, true)
  })
})
</script>

<template>
  <div ref="rootRef" class="relative w-full">
    <UInputTags
      v-model="model"
      ref="inputTagsRef"
      :placeholder="placeholder"
      :max="max"
      :add-on-blur="false"
      :add-on-tab="false"
      :add-on-paste="false"
      :convert-value="convertByKeys"
      :display-value="getItemLabel"
      class="w-full"
      :size="size"
    />
  </div>
  <UPopover
    v-model:open="dropdownOpen"
    :reference="popoverReference"
    :modal="false"
    :dismissible="false"
    :portal="true"
    :content="{ side: 'bottom', align: 'start', collisionPadding: 12 }"
    :ui="{
      content:
        'min-w-(--reka-popper-anchor-width) max-h-60 overflow-y-auto rounded-md border border-default bg-default p-1 shadow-lg z-9999',
    }"
    @open-auto-focus="onOpenAutoFocus"
  >
    <template #default>
      <span class="sr-only" aria-hidden="true" />
    </template>
    <template #content>
      <div ref="panelRef" role="listbox">
        <div v-if="status === 'pending'" class="text-muted p-3 text-sm">Loading…</div>
        <div v-else-if="!selectableItems.length" class="text-muted p-3 text-sm">
          No matching items
        </div>
        <template v-else>
          <button
            v-for="(item, idx) in selectableItems"
            :key="getItemKey(item)"
            type="button"
            role="option"
            :aria-selected="idx === activeIndex"
            class="flex w-full items-center rounded px-3 py-2 text-left text-sm hover:bg-elevated/50"
            :class="idx === activeIndex ? 'bg-elevated/50' : ''"
            @mousedown.prevent
            @click="selectItem(item)"
            @mouseenter="activeIndex = idx"
          >
            {{ getItemLabel(item) }}
          </button>
        </template>
      </div>
    </template>
  </UPopover>
</template>
