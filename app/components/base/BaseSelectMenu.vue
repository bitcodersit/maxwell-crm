<script setup lang="ts" generic="T extends any[]">
import type { SelectMenuProps } from '@nuxt/ui'

export type TSelectMenuProps<T extends any[] = any[]> = Omit<SelectMenuProps<T>, 'items'> & {
  api: string
}

const props = defineProps<TSelectMenuProps<T>>()

const model = useVModel(props, 'modelValue')

const { data, status, refresh } = useFetch<TPaginated<T>>(props.api, {
  lazy: true,
  server: false,
  immediate: false,
  default: () => toPaginated<T>(),
})

const onFocus = () => {
  refresh()
}
</script>

<template>
  <USelectMenu
    v-model="model"
    :items="data.data"
    :loading="status === 'pending'"
    :multiple="multiple"
    :value-key="valueKey"
    :label-key="labelKey"
    class="w-full"
    size="xl"
    @focus="onFocus"
  />
</template>
