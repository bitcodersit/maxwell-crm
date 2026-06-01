<script lang="ts">
import type { TBaseOrderByItem } from '@/components/base/BaseOrderByDropdown.vue'

type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Value extends TValue = TValue, Item extends TItem = TItem">
export type TFilterCheckboxProps<Value extends TValue = TValue, Item extends TItem = TItem> = {
  api: string
  label?: string
  query?: Record<string, any>
  dense?: boolean
  valueKey?: string
  modelValue?: Value[]
  labelClass?: string
  orderByItems?: TBaseOrderByItem[]
  getLabel?: (item: Item) => string | VNode
}

const props = withDefaults(defineProps<TFilterCheckboxProps<Value, Item>>(), {
  dense: false,
  valueKey: 'id',
  getLabel: (item: Item) => item.name
})

const emit = defineEmits<{
  (e: 'update:modelValue', value?: Value[]): void
}>()

const { api, label, query, modelValue, orderByItems } = toRefs(props)
const { state: searchTerm, stateD: searchTermD } = useDebouncedState('', 300)

const defaultPerPage = query.value?.perPage ?? 10
const perPage = ref(defaultPerPage)
const orderBy = ref<Record<string, 'asc' | 'desc'>>({})

const queryKey = computed(() => {
  return [
    api.value,
    {
      ...query.value,
      q: searchTermD.value,
      perPage: perPage.value,
      orderBy: orderBy.value
    }
  ] as const
})

const { data, isFetching, isFetched, refetch } = useQuery({
  queryKey,
  initialData: () => toPaginated<Item>(),
  queryFn: ({ queryKey: [api, query] }) => {
    return $fetch<TPaginated<Item>>(api, { query })
  }
})

const open = ref(false)
const state = ref<any>(modelValue.value)

const onOpen = () => {
  open.value = true
  refetch()
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

watch(modelValue, v => {
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
    <UChip
      :size="dense ? 'xs' : 'sm'"
      :inset="dense"
      :show="!!modelValue"
    >
      <UButton
        :icon="!dense ? 'i-lucide-filter' : undefined"
        :size="dense ? 'xs' : 'sm'"
        :ui="{
          base: dense ? 'rounded-full' : '',
          leadingIcon: dense ? 'size-3.5' : 'size-4'
        }"
        color="primary"
        variant="subtle"
        @click:trailing="onClear"
        @click="onOpen"
      >
        {{ label ?? 'Text' }}
        <UKbd
          v-if="modelValue?.length && !dense"
          size="sm"
        >
          {{ modelValue.length }}
        </UKbd>
        <template
          v-if="modelValue?.length && !dense"
          #trailing
        >
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
      <div class="">
        <UInput
          v-if="!dense"
          v-model="searchTerm"
          :autofocus="true"
          class="w-full"
          placeholder="Search..."
          @keyup.enter="onApply"
        />
        <UProgress
          v-if="isFetching"
          size="sm"
          animation="swing"
        />
      </div>
      <div
        v-if="!dense"
        class="flex items-center justify-between gap-2 mt-1"
      >
        <div class="flex items-center gap-2">
          <span
            role="button"
            class="text-primary underline text-xs cursor-pointer"
            @click="state = data.data.map((item: Item) => item[valueKey])"
          >
            Select all
          </span>
          <span
            v-if="state?.length"
            role="button"
            class="text-error underline text-xs cursor-pointer"
            @click="state = []"
          >
            Clear
          </span>
        </div>
        <div>
          <BaseOrderByDropdown
            v-model="orderBy"
            :items="orderByItems"
          />
        </div>
      </div>
      <div
        v-if="isFetched && !data.data.length"
        class="text-muted py-1 text-sm mt-1"
      >
        No results found
      </div>
      <UCheckboxGroup
        v-else
        v-model="state"
        size="lg"
        :items="data.data"
        :value-key="valueKey"
        :ui="{
          root: 'overflow-y-auto mt-1',
          label: labelClass
        }"
        @keyup.enter="onApply"
      >
        <template #label="{ item }">
          <VNode :value="getLabel(item)" />
        </template>
      </UCheckboxGroup>
      <UButton
        v-if="perPage < data.total"
        :disabled="isFetching"
        size="xs"
        label="Load More"
        variant="link"
        @click="perPage += defaultPerPage"
      />
      <div class="flex items-center gap-2 justify-end mt-3">
        <UButton
          v-if="modelValue"
          :icon="!dense ? 'i-lucide-x' : undefined"
          :size="dense ? 'xs' : 'sm'"
          label="Clear"
          color="error"
          variant="subtle"
          @click="onClear"
        />
        <UButton
          :disabled="!state?.length"
          :size="dense ? 'xs' : 'sm'"
          :icon="!dense ? 'i-lucide-check' : undefined"
          color="primary"
          label="Apply"
          variant="solid"
          @click="onApply"
        >
          <template
            v-if="state?.length && !dense"
            #trailing
          >
            <UKbd size="sm">
              {{ state?.length }}
            </UKbd>
          </template>
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
