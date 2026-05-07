<script context="module" lang="ts">
type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
import type { InputTagsProps } from '@nuxt/ui'
import type { TBaseSearchboxPopoverProps } from './BaseSearchboxPopover.vue'

export type TBaseAutocompleteProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = TBaseSearchboxPopoverProps<Item, Value> &
  Pick<InputTagsProps, 'size' | 'placeholder'> & {
  labelClass?: string
  itemKey?: (item: Item) => Value
}

const props = defineProps<TBaseAutocompleteProps<Item, Value>>()
const model = defineModel<Item[]>({ default: () => [] })

const popoverProps = computed(() => {
  const { size, placeholder, labelClass, itemKey, getValue, ...rest } = props
  return {
    ...rest,
    getValue: getValue || itemKey,
  }
})
</script>

<template>
  <BaseSearchboxPopover v-model="model" v-bind="popoverProps" class="w-full">
    <template #default="{ onInput, onFocus, onKeydown, setInputRef }">
      <UInputTags
        :ref="setInputRef"
        v-model="model"
        :size="size"
        :placeholder="placeholder"
        :add-on-blur="false"
        :add-on-tab="false"
        :add-on-paste="false"
        class="w-full"
        :ui="{
          itemText: labelClass,
        }"
        @focus="onFocus"
        @keydown.capture="onKeydown"
        @input="onInput"
      >
        <template #item-text="{ item }">
          <VNode :value="getLabel?.(item) ?? item?.name" />
        </template>
      </UInputTags>
    </template>
  </BaseSearchboxPopover>
</template>
