<script lang="ts">
import type { InputProps } from '@nuxt/ui'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<
    InputProps & {
      debounce?: number
    }
  >(),
  {
    debounce: 500,
    variant: 'subtle'
  }
)
const modelValue = defineModel<string>({ default: '' })
const { state, stateD } = useDebouncedState(modelValue.value, props.debounce)
watch(stateD, v => {
  modelValue.value = v
})
const rest = computed(() => {
  const { debounce, variant, defaultValue, ...rest } = props
  return rest
})
</script>

<template>
  <UChip :show="!!modelValue">
    <UInput
      v-bind="rest"
      v-model="state"
      :variant="variant"
    />
  </UChip>
</template>
