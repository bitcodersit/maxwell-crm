<script context="module" lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

export type TBaseOrderByItem = {
  label: string
  value: string
}
export type TBaseOrderBy = {
  [key: string]: 'asc' | 'desc'
}
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    items?: TBaseOrderByItem[]
    label?: string
  }>(),
  {
    label: 'Sort by',
    items: () => [
      { label: 'Id', value: 'id' },
      { label: 'Name', value: 'name' }
    ]
  }
)

const model = defineModel<TBaseOrderBy>({
  default: () => ({})
})

const items = computed(() => {
  return props.items.reduce<DropdownMenuItem[]>((acc, item) => {
    return [
      ...acc,
      ...(['asc', 'desc'] as const).map(direction => ({
        label: `${item.label} (${direction})`,
        onSelect() {
          model.value = {
            [item.value]: direction
          }
        }
      }))
    ]
  }, [])
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :portal="false"
    :ui="{ content: 'z-10001' }"
  >
    <span
      role="button"
      class="text-primary text-xs cursor-pointer"
    >
      <template v-if="Object.keys(model).length">
        {{
          Object.entries(model)
            .map(([key, value]) => `${key.charAt(0).toUpperCase() + key.slice(1)} (${value})`)
            .join(', ')
        }}
      </template>
      <template v-else>{{ label }}</template>
    </span>
  </UDropdownMenu>
</template>
