<script context="module" lang="ts">
type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
import type { InputProps } from '@nuxt/ui'
import type { TBaseSearchboxPopoverProps } from './BaseSearchboxPopover.vue'

export type TBaseSearchboxProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = TBaseSearchboxPopoverProps<Item, Value> & Pick<InputProps, 'size'>

const props = defineProps<TBaseSearchboxProps<Item, Value>>()
const model = defineModel<Item[]>({ required: true })

const popoverProps = computed(() => {
  const { size, ...rest } = props
  return rest
})
</script>

<template>
  <BaseSearchboxPopover v-model="model" v-bind="popoverProps">
    <template #default="{ searchTerm, onInput, onFocus, onKeydown, setInputRef }">
      <UInput
        :ref="setInputRef"
        :model-value="searchTerm"
        :size="size"
        class="w-full"
        @update:model-value="(v) => onInput(v)"
        @focus="onFocus"
        @keydown="onKeydown"
      />
    </template>
  </BaseSearchboxPopover>
</template>
