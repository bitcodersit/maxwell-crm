<script lang="ts">
import type { TBaseOrderByItem, TBaseOrderBy } from '@/components/base/BaseOrderByDropdown.vue'
import type { ClassValue } from 'vue'

type TValue = number | string
type TItem = Record<string, any>

export type TFormCardPickerProps<Item extends TItem = TItem, Value extends TValue = TValue> = {
  api: string
  class?: ClassValue
  query?: Record<string, any>
  orderByItems?: TBaseOrderByItem[]
  getValue?: (item: Item) => Value
  getLabel?: (item: Item) => string | VNode
  modalTitle?: string
  searchPlaceholder?: string
  removeConfirm?: string
  saveConfirm?: string
  disabled?: boolean
  perPage?: number
}
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
const props = withDefaults(defineProps<TFormCardPickerProps<Item, Value>>(), {
  getValue: (item: Item) => item.id,
  getLabel: (item: Item) => item.name,
  modalTitle: 'Select items',
  searchPlaceholder: 'Search...',
  removeConfirm: 'Are you sure you want to remove this item?',
  saveConfirm: 'Are you sure you want to save this selection?',
  disabled: false,
  perPage: 10,
  orderByItems: () => [
    { label: 'Id', value: 'id' },
    { label: 'Name', value: 'name' }
  ]
})

const model = defineModel<Item[]>({ default: () => [] })
const { confirm } = useConfirm()

const open = ref(false)
const page = ref(1)
const draft = ref<Item[]>([]) as Ref<Item[]>
const orderBy = ref<TBaseOrderBy>({})
const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)

const excludedIds = useComputedDebounced(() => {
  const ids = [
    ...model.value.map(x => props.getValue(x)),
    ...draft.value.map(x => props.getValue(x))
  ]
  return ids.join(',')
}, 300)

const queryKey = computed(() => {
  return [
    props.api,
    {
      ...props.query,
      q: searchTermD.value,
      orderBy: orderBy.value,
      page: page.value,
      perPage: props.perPage,
      idsNotIn: excludedIds.value || undefined
    }
  ] as const
})

const { data, isFetching } = useQuery({
  enabled: open,
  queryKey,
  queryFn({ queryKey: [api, query] }) {
    return $fetch<TPaginated<Item>>(api, { query })
  },
  initialData() {
    return toPaginated<Item>()
  }
})

const selectableItems = computed(() => {
  const selected = new Set([
    ...model.value.map(x => props.getValue(x)),
    ...draft.value.map(x => props.getValue(x))
  ])
  return (data.value.data || []).filter((row): row is Item => {
    if (!row) return false
    return !selected.has(props.getValue(row))
  })
})

const hasDraft = computed(() => draft.value.length > 0)

watch([searchTermD, orderBy, excludedIds], () => {
  page.value = 1
})

watch(
  () => data.value.totalPages,
  totalPages => {
    if (totalPages > 0 && page.value > totalPages) page.value = totalPages
  }
)

watch(open, value => {
  if (!value) {
    draft.value = []
    return
  }
  draft.value = []
  searchTerm.value = ''
  page.value = 1
})

const onSelectItem = (item: Item) => {
  if (props.disabled) return
  const value = props.getValue(item)
  if (model.value.some(x => props.getValue(x) === value)) return
  if (draft.value.some(x => props.getValue(x) === value)) return
  draft.value = [...draft.value, item]
}

const onRemoveDraftItem = (item: Item) => {
  const value = props.getValue(item)
  draft.value = draft.value.filter(x => props.getValue(x) !== value)
}

const onSave = async () => {
  if (props.disabled || !hasDraft.value) return
  if (!(await confirm(props.saveConfirm))) return
  model.value = [...model.value, ...draft.value]
  draft.value = []
  open.value = false
}

const onRemoveItem = async (item: Item) => {
  if (props.disabled) return
  if (!(await confirm(props.removeConfirm))) return
  const value = props.getValue(item)
  model.value = model.value.filter(x => props.getValue(x) !== value)
}
</script>

<template>
  <div
    class="w-full"
    :class="props.class"
  >
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="item in model"
        :key="String(getValue(item))"
        class="relative aspect-square rounded-lg border border-default bg-elevated/50 p-2 flex flex-col items-center justify-center gap-1.5 group"
      >
        <slot
          name="selected-item"
          :item="item"
          :remove="() => onRemoveItem(item)"
        >
          <div class="flex flex-col items-center justify-center gap-1.5 min-w-0 w-full">
            <UAvatar
              size="md"
              class="bg-primary/20"
              :alt="String(item?.name ?? '')"
              :ui="{ fallback: 'text-xs' }"
            />
            <span class="text-xs text-center truncate w-full px-1">
              <VNode :value="getLabel(item)" />
            </span>
          </div>
        </slot>
        <UButton
          v-if="!disabled"
          size="xs"
          color="error"
          variant="soft"
          icon="i-lucide-x"
          class="absolute top-1 right-1 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
          :ui="{ base: 'p-0.5 rounded-full' }"
          @click="onRemoveItem(item)"
        />
      </div>

      <button
        v-if="!disabled"
        type="button"
        class="aspect-square rounded-lg border border-dashed border-default hover:border-primary hover:bg-primary/5 transition-colors flex items-center justify-center text-muted hover:text-primary cursor-pointer"
        @click="open = true"
      >
        <slot name="add-card">
          <UIcon
            name="i-lucide-plus"
            class="size-6"
          />
        </slot>
      </button>
    </div>

    <UModal
      v-model:open="open"
      :title="modalTitle"
      :ui="{
        content: 'max-w-sm w-full',
        body: 'p-0 sm:p-0',
        footer: 'justify-end'
      }"
    >
      <template #body>
        <div class="flex flex-col min-h-72">
          <div class="flex items-center gap-2 px-4 pt-4 pb-3">
            <UInput
              v-model="searchTerm"
              class="flex-1"
              icon="i-lucide-search"
              :placeholder="searchPlaceholder"
              autofocus
            />
            <BaseOrderByDropdown
              v-model="orderBy"
              :items="orderByItems"
            />
          </div>
          <div
            v-if="hasDraft"
            class="flex flex-wrap gap-1.5 px-4 pb-3"
          >
            <UBadge
              v-for="item in draft"
              :key="String(getValue(item))"
              color="primary"
              variant="subtle"
              class="gap-1"
            >
              <span class="truncate max-w-28">
                <VNode :value="getLabel(item)" />
              </span>
              <UButton
                size="xs"
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                class="p-0"
                :ui="{ leadingIcon: 'size-3' }"
                @click="onRemoveDraftItem(item)"
              />
            </UBadge>
          </div>

          <div class="relative flex-1 min-h-48">
            <UProgress
              v-if="isFetching"
              size="sm"
              animation="swing"
              class="absolute inset-x-0 top-0 z-10"
            />
            <div
              v-if="!selectableItems.length && !isFetching"
              class="text-muted text-sm py-8 text-center px-4"
            >
              No matching items
            </div>
            <div
              v-else
              class="flex flex-col max-h-64 overflow-y-auto scrollbar"
            >
              <button
                v-for="item in selectableItems"
                :key="String(getValue(item))"
                type="button"
                class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-elevated transition-colors"
                @click="onSelectItem(item)"
              >
                <slot
                  name="option-item"
                  :item="item"
                >
                  <UAvatar
                    size="sm"
                    class="bg-primary/20 flex-none"
                    :alt="String(item?.name ?? '')"
                    :ui="{ fallback: 'text-xs' }"
                  />
                  <span class="truncate text-sm">
                    <VNode :value="getLabel(item)" />
                  </span>
                </slot>
              </button>
            </div>
          </div>

          <div
            v-if="data.total > perPage"
            class="flex justify-center px-4 py-2 border-t border-default"
          >
            <UPagination
              v-model:page="page"
              size="sm"
              :items-per-page="perPage"
              :total="data.total"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          color="neutral"
          variant="subtle"
          label="Cancel"
          @click="open = false"
        />
        <UButton
          color="primary"
          label="Save"
          :disabled="!hasDraft"
          @click="onSave"
        >
          <template
            v-if="hasDraft"
            #trailing
          >
            <UKbd size="sm">
              {{ draft.length }}
            </UKbd>
          </template>
        </UButton>
      </template>
    </UModal>
  </div>
</template>
