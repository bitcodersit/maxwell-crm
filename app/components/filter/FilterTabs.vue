<script lang="ts">
type TItem = Record<string, any>

export type TFilterTabsProps<Item extends TItem = TItem> = {
  api: string
  query?: Record<string, any>
  getLabel?: (item: Item) => string
  getValue?: (item: Item) => number | string
}
</script>

<script setup lang="ts" generic="Item extends TItem = TItem">
//
const props = withDefaults(defineProps<TFilterTabsProps<Item>>(), {
  getLabel: (item: Item) => item.name,
  getValue: (item: Item) => item.id
})

const model = defineModel<number | string>({
  default: ''
})

const queryKey = computed(() => {
  return [props.api, props.query] as const
})

const { data } = useQuery({
  queryKey,
  initialData: () => toPaginated<Item>(),
  queryFn: ({ queryKey: [api, query] }) => {
    return $fetch<TPaginated<Item>>(api, { query })
  }
})

const items = computed(() => {
  return [
    { label: 'All', value: '' },
    ...data.value.data.map(item => {
      return {
        label: props.getLabel(item),
        value: props.getValue(item)
      }
    })
  ]
})
</script>

<template>
  <div>
    <UTabs
      v-model="model"
      :size="'xs'"
      :variant="'pill'"
      :content="false"
      :items="items"
      class="w-full"
    />
  </div>
</template>
