<script context="module" lang="ts">
import type { TBaseOrderByItem, TBaseOrderBy } from './BaseOrderByDropdown.vue'
import type { ClassValue } from 'vue'

type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
export type TBaseSearchboxProviderSlotProps = {
  searchTerm: string
  onInput: (event: Event | string) => void
  onFocus: () => void
  onKeydown: (event: KeyboardEvent) => void
  setInputRef: (el: any) => void
  setSearchTerm: (value: string) => void
}

export type TBaseSearchboxProviderProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = {
  api: string
  class?: ClassValue
  query?: Record<string, any>
  orderByItems?: TBaseOrderByItem[]
  hideOnSelect?: boolean
  clearOnSelect?: boolean
  getValue?: (item: Item) => Value
  getLabel?: (item: Item) => string | VNode
}

const props = withDefaults(defineProps<TBaseSearchboxProviderProps<Item, Value>>(), {
  getValue: (item: Item) => item.id,
  getLabel: (item: Item) => item.name
})

const { api, query, hideOnSelect, clearOnSelect } = toRefs(props)
const model = defineModel<Item[]>({ required: true })

const rootRef = useTemplateRef<HTMLElement>('rootRef')
const panelRef = useTemplateRef<HTMLElement>('panelRef')
const popoverReference = computed(() => rootRef.value ?? undefined)

const activeIndex = ref(0)
const dropdownOpen = ref(false)
const orderBy = ref<TBaseOrderBy>({})
const inputRef = shallowRef<HTMLInputElement | null>(null)

const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)

const idsNotIn = useComputedDebounced(() => {
  return model.value.map(x => props.getValue(x)).join(',')
}, 1000)

const queryKey = computed(() => {
  return [
    api.value,
    {
      ...query.value,
      q: searchTermD.value,
      orderBy: orderBy.value,
      idsNotIn: idsNotIn.value
    }
  ] as const
})

const { data, isFetching } = useQuerySSR({
  enabled: dropdownOpen,
  queryKey,
  queryFn({ queryKey: [api, query] }) {
    return $fetch<TPaginated<Item>>(api, {
      query
    })
  },
  initialData() {
    return toPaginated<Item>()
  }
})

const selectableItems = computed(() => {
  const selected = new Set(model.value.map(x => props.getValue(x)))
  return (data.value.data || []).filter((row): row is Item => {
    if (!row) return false
    return !selected.has(props.getValue(row))
  })
})

const onOpenAutoFocus = (event: Event) => {
  event.preventDefault()
}

const focusInput = () => {
  inputRef.value?.focus({ preventScroll: true })
}

const onSelectItem = (item?: Item) => {
  if (!item) return
  if (model.value.some(x => props.getValue(x) === props.getValue(item))) return
  model.value = [...model.value, item]
  if (clearOnSelect.value) searchTerm.value = ''
  if (hideOnSelect.value) {
    dropdownOpen.value = false
    inputRef.value?.blur()
  } else {
    focusInput()
    dropdownOpen.value = true
    activeIndex.value = 0
  }
}

const setInputRef = (el: any) => {
  inputRef.value = el?.inputRef || el?.$el?.querySelector?.('input') || el || null
}

const setSearchTerm = (value: string) => {
  searchTerm.value = value
}

const onInput = (event: Event | string) => {
  const value = typeof event === 'string' ? event : (event.target as HTMLInputElement)?.value || ''
  searchTerm.value = value
  dropdownOpen.value = true
}

const onFocus = () => {
  dropdownOpen.value = true
  activeIndex.value = 0
}

const onKeydown = (e: KeyboardEvent) => {
  if (e.isComposing) return

  if (e.key === 'Enter' || e.key === ',') {
    e.preventDefault()
    e.stopPropagation()
    if (
      !isFetching.value &&
      e.key === 'Enter' &&
      dropdownOpen.value &&
      selectableItems.value.length
    ) {
      const item = selectableItems.value[activeIndex.value]
      if (item) onSelectItem(item)
    }
    return
  }

  if (e.key === 'Escape' && dropdownOpen.value) {
    e.preventDefault()
    e.stopPropagation()
    dropdownOpen.value = false
    return
  }

  if (!dropdownOpen.value || isFetching.value || !selectableItems.value.length) return

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

const slotProps = computed<TBaseSearchboxProviderSlotProps>(() => ({
  searchTerm: searchTerm.value,
  setSearchTerm,
  onInput,
  onFocus,
  onKeydown,
  setInputRef
}))

onClickOutside(
  rootRef,
  () => {
    dropdownOpen.value = false
  },
  { ignore: [panelRef] }
)

watch(selectableItems, list => {
  if (!list.length) {
    activeIndex.value = 0
    return
  }
  if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
})

watch(dropdownOpen, async open => {
  if (!open) return
  await nextTick()
  focusInput()
})
</script>

<template>
  <div
    ref="rootRef"
    class="relative"
    :class="props.class"
  >
    <slot v-bind="slotProps" />
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
        'w-(--reka-popper-anchor-width) max-h-60 overflow-visible rounded-md border border-accented bg-elevated p-1 shadow-lg z-9999'
    }"
    @open-auto-focus="onOpenAutoFocus"
  >
    <template #default>
      <span
        class="sr-only"
        aria-hidden="true"
      />
    </template>
    <template #content>
      <div
        ref="panelRef"
        role="listbox"
        class="overflow-visible"
      >
        <div
          v-if="isFetching"
          class="absolute inset-x-0 top-0 px-1.5"
        >
          <UProgress
            size="sm"
            animation="swing"
          />
        </div>
        <div class="flex justify-start px-2 py-1">
          <BaseOrderByDropdown
            v-model="orderBy"
            :items="orderByItems"
          />
        </div>
        <div
          v-if="!selectableItems.length"
          class="text-muted p-3 text-sm"
        >
          No matching items
        </div>
        <div
          v-else
          class="max-h-48 overflow-y-auto"
        >
          <template
            v-for="(item, idx) in selectableItems"
            :key="getValue(item)"
          >
            <USeparator :ui="{ border: 'border-accented', root: 'px-2' }" />
            <UButton
              v-if="true"
              :class="[idx === activeIndex ? 'bg-elevated/50' : '']"
              :aria-selected="idx === activeIndex"
              role="option"
              type="button"
              color="neutral"
              class="w-full"
              variant="soft"
              @mousedown.prevent
              @click="onSelectItem(item)"
              @mouseenter="activeIndex = idx"
            >
              <VNode :value="getLabel(item)" />
            </UButton>
          </template>
        </div>
      </div>
    </template>
  </UPopover>
</template>
