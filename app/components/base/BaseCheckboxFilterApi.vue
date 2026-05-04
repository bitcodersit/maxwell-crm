<script context="module" lang="ts">
type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Value extends TValue = TValue, Item extends TItem = TItem">
export type TCheckboxFilterApiProps<Value extends TValue = TValue, Item extends TItem = TItem> = {
  api: string
  label?: string
  query?: Record<string, any>
  modelValue?: Value[]
  itemLabel?: (item: Item) => string
}

const props = withDefaults(defineProps<TCheckboxFilterApiProps<Value, Item>>(), {
  itemLabel: (item: Item) => item.name,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value?: Value[]): void
}>()

const { api, label, query, modelValue } = toRefs(props)
const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)

const { data, status, execute } = useFetchApi({
  endpoint: api,
  immediate: false,
  staleTime: 10 * 1000,
  query: computed(() => ({
    ...query.value,
    q: searchTermD.value,
  })),
  getDefault() {
    return toPaginated<Item>()
  },
})

const open = ref(false)
const state = ref<any>(modelValue.value)

// const model = computed({
//   get() {
//     return state.value?.map((item) => {
//       return itemKey.value(item as T)
//     })
//   },
//   set(v) {
//     state.value = v
//       ?.map((value) => {
//         return (data.value?.data?.find((item) => itemKey.value(item) === value) ||
//           state.value?.find((item) => itemKey.value(item as T) === value)) as T
//       })
//       ?.filter(Boolean)
//   },
// })

const onOpen = () => {
  open.value = true
  execute()
}

const onApply = () => {
  emit('update:modelValue', state.value)
  open.value = false
}

const onClear = () => {
  state.value = []
  emit('update:modelValue', undefined)
  open.value = false
}

watch(modelValue, (v) => {
  if (v == state.value) return
  state.value = v
})
</script>

<template>
  <UPopover
    v-model:open="open"
    :arrow="true"
    :ui="{ content: 'p-3 flex flex-col gap-3 max-w-64 w-full' }"
    :content="{ align: 'start', side: 'bottom' }"
  >
    <UChip :show="!!modelValue">
      <UButton
        icon="i-lucide-filter"
        color="primary"
        variant="subtle"
        :ui="{ leadingIcon: 'size-4' }"
        @click:trailing="onClear"
        @click="onOpen"
      >
        {{ label ?? 'Text' }}
        <UKbd v-if="modelValue?.length">
          {{ modelValue.length }}
        </UKbd>
        <template v-if="modelValue" #trailing>
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="error"
            variant="soft"
            :ui="{ leadingIcon: 'size-3.5', base: 'p-0.5 rounded-full' }"
            @click.stop.prevent="onClear"
          />
        </template>
      </UButton>
    </UChip>
    <template #content>
      <div>
        <UInput v-model="searchTerm" :autofocus="true" placeholder="Search..." class="w-full" />
        <UProgress v-if="status === 'pending'" size="sm" animation="swing" />
      </div>
      <div v-if="!data.data.length">
        <div class="text-muted p-3 text-sm">No results found</div>
      </div>
      <UCheckboxGroup
        v-else
        v-model="state"
        :items="data.data"
        value-key="id"
        label-key="name"
        :ui="{
          root: 'overflow-hidden',
          description: 'truncate',
        }"
        @keyup.enter="onApply"
      />
      <div class="flex items-center gap-2 justify-end">
        <UButton
          v-if="modelValue"
          icon="i-lucide-x"
          size="sm"
          color="error"
          variant="subtle"
          @click="onClear"
        >
          Clear
        </UButton>
        <UButton
          icon="i-lucide-check"
          color="primary"
          variant="solid"
          size="sm"
          :disabled="!state?.length"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
