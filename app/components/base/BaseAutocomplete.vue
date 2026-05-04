<script setup lang="ts">
import type { ButtonProps, InputTagsProps } from '@nuxt/ui'

type TItem = Record<string, any>
export type TBaseAutocompleteProps = InputTagsProps & {
  api: string
  optionProps?: ButtonProps | ((item: TItem, index: number, isActive: boolean) => ButtonProps)
  emptyMessage?: string
  query?: Record<string, any>
  itemKey?: (item: TItem) => string
  itemLabel?: (item: TItem) => string
}

const props = withDefaults(defineProps<TBaseAutocompleteProps>(), {
  emptyMessage: 'No matching items',
  itemKey: (item: TItem) => item.id,
  itemLabel: (item: TItem) => item.name,
})

const { api, query } = toRefs(props)

const model = defineModel<TItem[]>({ default: () => [] })
const rootRef = useTemplateRef<HTMLElement>('rootRef')
const panelRef = useTemplateRef<HTMLElement>('panelRef')
const activeIndex = ref(0)
const dropdownOpen = ref(false)
const inputTagsRef = useTemplateRef<{ inputRef: HTMLInputElement | null }>('inputTagsRef')
const popoverReference = computed(() => rootRef.value ?? undefined)

const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)
const { data, status, execute } = useFetchApi({
  api,
  immediate: false,
  staleTime: 10 * 1000,
  query: computed(() => ({
    ...query.value,
    q: searchTermD.value,
  })),
  getDefault() {
    return toPaginated<TItem>()
  },
})

const selectableItems = computed(() => {
  const selected = new Set(model.value.map((x) => props.itemKey(x)))
  return data.value.data.filter((row) => !selected.has(props.itemKey(row))) ?? []
})

const onOpenAutoFocus = (event: Event) => {
  event.preventDefault()
}

const onSelectItem = (item: TItem) => {
  if (props.max != null && model.value.length >= props.max) return
  if (model.value.some((x) => props.itemKey(x) === props.itemKey(item))) return
  model.value = [...model.value, item]
  const input = inputTagsRef.value?.inputRef
  if (input) {
    input.focus({ preventScroll: true })
  }
  dropdownOpen.value = true
  activeIndex.value = 0
}

const getOptionProps = (item: TItem, index: number, isActive: boolean) => {
  if (typeof props.optionProps === 'function') {
    return props.optionProps(item, index, isActive)
  }
  return props.optionProps
}

onClickOutside(
  rootRef,
  () => {
    dropdownOpen.value = false
  },
  { ignore: [panelRef] }
)

watch(selectableItems, (list) => {
  if (!list.length) {
    activeIndex.value = 0
    return
  }
  if (activeIndex.value >= list.length) activeIndex.value = list.length - 1
})

watch(dropdownOpen, async (open) => {
  if (!open) return
  await nextTick()
  const input = inputTagsRef.value?.inputRef
  if (!input) return
  if (document.activeElement !== input) {
    input.focus({ preventScroll: true })
  }
})

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
    execute()
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
      :display-value="itemLabel"
      :ui="ui"
      :size="size"
      class="w-full"
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
      <div ref="panelRef" role="listbox" class="overflow-hidden">
        <div v-if="status === 'pending'" class="absolute inset-x-0 top-0 px-1.5">
          <UProgress size="sm" animation="swing" />
        </div>
        <div v-if="!selectableItems.length" class="text-muted p-3 text-sm">{{ emptyMessage }}</div>
        <UButton
          v-for="(item, idx) in selectableItems"
          :key="itemKey(item)"
          :label="itemLabel(item)"
          :class="idx === activeIndex ? 'bg-elevated/50' : ''"
          :aria-selected="idx === activeIndex"
          role="option"
          type="button"
          color="neutral"
          class="w-full"
          variant="ghost"
          v-bind="getOptionProps(item, idx, idx === activeIndex)"
          @mousedown.prevent
          @click="onSelectItem(item)"
          @mouseenter="activeIndex = idx"
        />
      </div>
    </template>
  </UPopover>
</template>
