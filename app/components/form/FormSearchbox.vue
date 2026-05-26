<script lang="ts">
import type { TBaseSearchboxProviderProps } from '@/components/base/BaseSearchboxProvider.vue'
import type { InputProps } from '@nuxt/ui'

type TValue = number | string
type TItem = Record<string, any>

export type TFormSearchboxProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = TBaseSearchboxProviderProps<Item, Value> & Pick<InputProps, 'size' | 'placeholder'>
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
const props = defineProps<TFormSearchboxProps<Item, Value>>()
const model = defineModel<Item[]>({ required: true })

const providerProps = computed(() => {
  const { size, placeholder, ...rest } = props
  return rest
})
</script>

<template>
  <BaseSearchboxProvider
    v-model="model"
    v-bind="providerProps"
  >
    <template #default="{ searchTerm, onInput, onFocus, onKeydown, setInputRef }">
      <UInput
        :ref="setInputRef"
        :model-value="searchTerm"
        :size="size"
        :placeholder="placeholder"
        class="w-full"
        @update:model-value="v => onInput(v)"
        @focus="onFocus"
        @keydown="onKeydown"
      />
    </template>
  </BaseSearchboxProvider>
</template>
