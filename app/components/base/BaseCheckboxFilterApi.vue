<script context="module" lang="ts">
type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Value extends TValue = TValue, Item extends TItem = TItem">
export type TCheckboxFilterApiProps<Value extends TValue = TValue, Item extends TItem = TItem> = {
  api: string
  label?: string
  query?: Record<string, any>
  valueKey?: string
  modelValue?: Value[]
  labelClass?: string
  getLabel?: (item: Item) => string
}

const props = withDefaults(defineProps<TCheckboxFilterApiProps<Value, Item>>(), {
  valueKey: 'id',
  getLabel: (item: Item) => item.name,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value?: Value[]): void
}>()

const { api, label, query, modelValue } = toRefs(props)
const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)

const defaultPerPage = query.value?.perPage ?? 10
const perPage = ref(defaultPerPage)

const { data, status, execute } = useFetchApi({
  api,
  staleTime: 10 * 1000,
  immediate: false,
  query: computed(() => ({
    ...query.value,
    q: searchTermD.value,
    perPage: perPage.value,
  })),
  getDefault() {
    return toPaginated<Item>()
  },
})

const open = ref(false)
const state = ref<any>(modelValue.value)

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
    :ui="{ content: 'p-3 flex flex-col max-w-64 w-full max-h-[600px]' }"
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
      <div class="flex items-center gap-2 justify-end">
        <span
          role="button"
          class="text-primary underline text-sm cursor-pointer"
          @click="state = data.data.map((item: Item) => item[valueKey])"
        >
          Select all
        </span>
        <span role="button" class="text-error underline text-sm cursor-pointer" @click="state = []">
          Clear
        </span>
      </div>
      <div class="mt-1">
        <UInput
          v-model="searchTerm"
          :autofocus="true"
          class="w-full"
          placeholder="Search..."
          @keyup.enter="onApply"
        />
        <UProgress v-if="status === 'pending'" size="sm" animation="swing" />
      </div>
      <div v-if="status !== 'pending' && !data.data.length" class="text-muted py-1 text-sm mt-3">
        No results found
      </div>
      <UCheckboxGroup
        v-else
        v-model="state"
        size="lg"
        :items="data.data"
        :value-key="valueKey"
        :ui="{
          root: 'overflow-y-auto mt-3',
          label: labelClass,
        }"
        @keyup.enter="onApply"
      >
        <template #label="{ item }">
          {{ getLabel(item) }}
        </template>
      </UCheckboxGroup>
      <UButton
        v-if="perPage < data.total"
        :disabled="status === 'pending'"
        size="xs"
        label="Load More"
        variant="link"
        @click="perPage += defaultPerPage"
      />
      <div class="flex items-center gap-2 justify-end mt-3">
        <UButton
          v-if="modelValue"
          icon="i-lucide-x"
          label="Clear"
          size="sm"
          color="error"
          variant="subtle"
          @click="onClear"
        />
        <UButton
          :disabled="!state?.length"
          icon="i-lucide-check"
          color="primary"
          label="Apply"
          variant="solid"
          size="sm"
          @click="onApply"
        >
          <template v-if="state?.length" #trailing>
            <UKbd size="sm">
              {{ state?.length }}
            </UKbd>
          </template>
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
