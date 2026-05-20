<script lang="ts">
import type {
  ArrayOrNested,
  GetItemKeys,
  ModelModifiers,
  SelectMenuItem,
  SelectMenuProps
} from '@nuxt/ui'

export type TFormSelectMenuProps<
  T extends ArrayOrNested<SelectMenuItem>,
  VK extends GetItemKeys<T> | undefined = undefined,
  M extends boolean = false,
  Mod extends Omit<ModelModifiers, 'lazy'> = Omit<ModelModifiers, 'lazy'>,
  C extends boolean | object = false
> = Omit<
  SelectMenuProps<T, VK, M, Mod, C>,
  'search-term' | 'ignore-filter' | 'items' | 'loading' | 'reset-model-value-on-clear'
> & {
  api: string
  query?: Record<string, any>
}
</script>

<script
  setup
  lang="ts"
  generic="
    T extends ArrayOrNested<SelectMenuItem>,
    VK extends GetItemKeys<T> | undefined = undefined,
    M extends boolean = false,
    Mod extends Omit<ModelModifiers, 'lazy'> = Omit<ModelModifiers, 'lazy'>,
    C extends boolean | object = false
  "
>
const props = withDefaults(defineProps<TFormSelectMenuProps<T, VK, M, Mod, C>>(), {
  icon: 'i-lucide-search',
  labelKey: 'name'
})

const open = defineModel<boolean>('open')
const model = defineModel<any>()

const s = ref('')
const q = refDebounced(s, 300)

const queryKey = computed(() => {
  return [props.api, props.query, q.value] as const
})

const { data, isFetching } = useQuery({
  enabled: open,
  queryKey,
  initialData: () => toPaginated<any>(),
  queryFn: ({ queryKey: [api, query, q] }) => {
    return $fetch<TPaginated<any>>(api, {
      query: {
        ...query,
        q
      }
    })
  }
})

const items = computed(() => (data.value.data || []) as T)
const searchInput = computed(() => {
  return s.value || data.value.totalPages > 1 ? props.searchInput || true : false
})

const rest = computed(() => {
  const {
    api,
    query,
    open,
    modelValue,
    searchInput,
    ignoreFilter,
    resetModelValueOnClear,
    ...rest
  } = props
  return rest as any
})
</script>

<template>
  <USelectMenu
    v-model="model"
    v-model:open="open"
    v-model:search-term="s"
    v-bind="rest"
    :items="items"
    :loading="isFetching"
    :search-input="searchInput"
    :ignore-filter="true"
    :reset-model-value-on-clear="true"
  />
</template>
