<script setup lang="ts">
import type { CalendarProps } from '@nuxt/ui'

type TValue = CalendarProps['modelValue']
type TMode = 'single' | 'range' | 'multiple'

export type TDateFilterProps = CalendarProps & {
  mode?: TMode
  label?: string
}

const props = withDefaults(defineProps<TDateFilterProps>(), {
  mode: 'single',
})

const emit = defineEmits<{
  (e: 'update:mode', mode?: TMode): void
  (e: 'update:modelValue', value?: TValue): void
}>()

const { mode: modelMode, modelValue } = toRefs(props)

const open = ref(false)
const mode = ref<TMode>(modelMode.value)
const value = ref<any>(modelValue.value)

const onClear = () => {
  value.value = undefined
  emit('update:mode', undefined)
  emit('update:modelValue', undefined)
  open.value = false
}

const onApply = () => {
  if (!value.value) return
  emit('update:mode', mode.value)
  emit('update:modelValue', value.value)
  open.value = false
}

watch(modelValue, (v) => {
  if (!v) return
  if (v == value.value) return
  value.value = v
})

watch(modelMode, (v) => {
  if (v === mode.value) return
  mode.value = v ?? 'single'
})
</script>

<template>
  <UPopover
    v-model:open="open"
    :arrow="true"
    :ui="{ content: 'p-3 flex flex-col gap-3' }"
    :content="{ align: 'start', side: 'bottom' }"
  >
    <UChip :show="!!modelValue">
      <UButton
        icon="i-lucide-filter"
        color="primary"
        variant="subtle"
        :ui="{ leadingIcon: 'size-4' }"
        @click="open = true"
      >
        {{ label ?? 'Date' }}
        <template v-if="modelValue">
          |
          {{
            calendarFormatDate(modelValue, {
              returnType: 'display',
            })
          }}
        </template>
      </UButton>
    </UChip>
    <template #content>
      <URadioGroup
        v-model="mode"
        orientation="horizontal"
        @change="value = undefined"
        :items="[
          { label: 'Single', value: 'single' },
          { label: 'Range', value: 'range' },
          { label: 'Multiple', value: 'multiple' },
        ]"
      />
      <UCalendar v-model="value" :range="mode === 'range'" :multiple="mode === 'multiple'" />
      <div class="flex items-center gap-2 justify-end">
        <UButton
          v-if="modelValue"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="onClear"
        >
          Clear
        </UButton>
        <UButton
          icon="i-lucide-check"
          color="primary"
          variant="solid"
          size="sm"
          :disabled="!value"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
