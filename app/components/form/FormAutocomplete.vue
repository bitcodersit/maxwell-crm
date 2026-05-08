<script context="module" lang="ts">
type TValue = number | string
type TItem = Record<string, any>
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
import type { InputTagsProps } from '@nuxt/ui'
import type { TBaseSearchboxProviderProps } from '@/components/base/BaseSearchboxProvider.vue'

export type TFormAutocompleteProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = TBaseSearchboxProviderProps<Item, Value> &
  Pick<InputTagsProps, 'size' | 'placeholder'> & {
    labelClass?: string
    itemKey?: (item: Item) => Value
  }

const props = defineProps<TFormAutocompleteProps<Item, Value>>()
const model = defineModel<Item[]>({ default: () => [] })

const providerProps = computed(() => {
  const { size, placeholder, labelClass, itemKey, getValue, ...rest } = props
  return {
    ...rest,
    getValue: getValue || itemKey,
  }
})
</script>

<template>
  <BaseSearchboxProvider v-model="model" v-bind="providerProps" class="w-full">
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
  </BaseSearchboxProvider>
</template>
