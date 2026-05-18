<script lang="ts">
import type { InputProps } from '@nuxt/ui'

export type TFormColorPickerProps = Pick<InputProps, 'size' | 'class'>
</script>

<script setup lang="ts">
const props = defineProps<TFormColorPickerProps>()
const model = defineModel<string>({
  default: ''
})
</script>

<template>
  <div class="relative">
    <UInput
      v-model="model"
      readonly
      :size="size"
      :class="props.class"
    />
    <UPopover
      arrow
      :ui="{ content: 'p-4' }"
      :content="{ align: 'end', side: 'bottom' }"
    >
      <UButton
        size="sm"
        color="neutral"
        variant="soft"
        class="absolute top-1/2 -translate-y-1/2 right-2 z-10"
        :label="model || 'Color'"
        :style="{ backgroundColor: model }"
      />
      <template #content>
        <UColorPicker v-model="model" />
      </template>
    </UPopover>
  </div>
</template>
