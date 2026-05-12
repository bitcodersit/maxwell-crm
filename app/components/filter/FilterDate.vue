<script setup lang="ts">
import type { CalendarProps } from '@nuxt/ui'

type TValue = CalendarProps['modelValue']
type TMode = 'single' | 'range' | 'multiple'

export type TFilterDateProps = CalendarProps & {
  mode?: TMode
  label?: string
  dense?: boolean
}

const props = withDefaults(defineProps<TFilterDateProps>(), {
  mode: 'single',
  dense: false
})

const emit = defineEmits<{
  'update:mode': [mode?: TMode]
  'update:modelValue': [value?: TValue]
}>()

const { mode: modelMode, modelValue } = toRefs(props)

const open = ref(false)
const mode2 = ref<TMode>(modelMode.value)
const value = ref<any>(modelValue.value)

const onClear = () => {
  value.value = undefined
  emit('update:mode', undefined)
  emit('update:modelValue', undefined)
  open.value = false
}

const onApply = () => {
  if (!value.value) return
  emit('update:mode', mode2.value)
  emit('update:modelValue', value.value)
  open.value = false
}

watch(modelValue, v => {
  if (!v) return
  if (v == value.value) return
  value.value = v
})

watch(modelMode, v => {
  if (v === mode2.value) return
  mode2.value = v ?? 'single'
})
</script>

<template>
  <UPopover
    v-model:open="open"
    :arrow="true"
    :ui="{ content: 'p-3 flex flex-col gap-3' }"
    :content="{ align: 'start', side: 'bottom' }"
  >
    <UChip
      :show="!!modelValue"
      :size="dense ? 'xs' : 'md'"
      :inset="dense"
    >
      <UButton
        color="primary"
        variant="subtle"
        :icon="!dense ? 'i-lucide-filter' : undefined"
        :size="dense ? 'xs' : 'md'"
        :ui="{
          base: dense ? 'rounded-full' : '',
          leadingIcon: dense ? 'size-3.5' : 'size-4'
        }"
        @click="open = true"
      >
        {{ label ?? 'Date' }}
        <template v-if="modelValue && !dense">
          |
          {{
            calendarFormatDate(modelValue, {
              returnType: 'display'
            })
          }}
        </template>
        <template
          v-if="modelValue && !dense"
          #trailing
        >
          <UButton
            icon="i-lucide-x"
            size="xs"
            color="error"
            variant="soft"
            :ui="{ leadingIcon: 'size-3.5', base: 'p-0.5 rounded-full' }"
            @click.stop.prevent="onClear"
          />
        </template>
      </UButton>
    </UChip>
    <template #content>
      <URadioGroup
        v-model="mode2"
        orientation="horizontal"
        :items="[
          { label: 'Single', value: 'single' },
          { label: 'Range', value: 'range' },
          { label: 'Multiple', value: 'multiple' }
        ]"
        @change="value = undefined"
      />
      <UCalendar
        v-model="value"
        :range="mode2 === 'range'"
        :multiple="mode2 === 'multiple'"
      />
      <div class="flex items-center gap-2 justify-end">
        <UButton
          v-if="modelValue"
          :icon="!dense ? 'i-lucide-x' : undefined"
          :size="dense ? 'xs' : 'sm'"
          color="error"
          variant="subtle"
          @click="onClear"
        >
          Clear
        </UButton>
        <UButton
          :icon="!dense ? 'i-lucide-check' : undefined"
          :size="dense ? 'xs' : 'sm'"
          color="primary"
          variant="solid"
          :disabled="!value"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
