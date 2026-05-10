<script lang="ts">
import type { InputProps } from '@nuxt/ui'
</script>

<script setup lang="ts">
const props = withDefaults(
  defineProps<
    Omit<InputProps, 'icon' | 'variant'> & {
      debounce?: number
    }
  >(),
  {
    debounce: 500
  }
)
const modelValue = defineModel<string>({ default: '' })
const { state, stateD } = useDebouncedState(modelValue.value, props.debounce)
const rest = computed(() => {
  const { debounce, modelValue, defaultValue, ...rest } = props
  return rest
})
watch(stateD, v => {
  modelValue.value = v
})
watch(modelValue, v => {
  if (state.value === v) return
  state.value = v
})
</script>

<template>
  <UChip :show="!!modelValue">
    <UInput
      v-bind="rest"
      v-model="state"
      icon="i-lucide-search"
      variant="subtle"
      :highlight="false"
      :ui="{
        base: 'bg-primary/15 ring ring-primary/25 focus-visible:ring-1 focus-visible:ring-primary/25 text-primary font-semibold placeholder:text-primary/50',
        leadingIcon: 'text-primary'
      }"
    >
      <template
        v-if="state?.length"
        #trailing
      >
        <UButton
          icon="i-lucide-x"
          size="xs"
          color="error"
          variant="soft"
          :ui="{ leadingIcon: 'size-3.5', base: 'p-0.5 rounded-full' }"
          @click="state = ''"
        />
      </template>
    </UInput>
  </UChip>
</template>
