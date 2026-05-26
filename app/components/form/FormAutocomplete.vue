<script lang="ts">
import type { TBaseSearchboxProviderProps } from '@/components/base/BaseSearchboxProvider.vue'
import type { InputTagsProps } from '@nuxt/ui'

type TValue = number | string
type TItem = Record<string, any>

export type TFormAutocompleteProps<
  Item extends TItem = TItem,
  Value extends TValue = TValue
> = TBaseSearchboxProviderProps<Item, Value> &
  Pick<InputTagsProps, 'size' | 'placeholder'> & {
    labelClass?: string
  }
</script>

<script setup lang="ts" generic="Item extends TItem = TItem, Value extends TValue = TValue">
const props = defineProps<TFormAutocompleteProps<Item, Value>>()
const model = defineModel<Item[]>({ default: () => [] })

const providerProps = computed(() => {
  const { size, placeholder, labelClass, modelValue, ...rest } = props as any
  return rest
})
</script>

<template>
  <BaseSearchboxProvider
    v-model="model"
    v-bind="providerProps"
    class="w-full"
  >
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
          itemText: labelClass
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
