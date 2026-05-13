<script setup lang="ts">
import type { CalendarProps } from '@nuxt/ui'
export type TDateFilterMode = 'lt' | 'lte' | 'eq' | 'gte' | 'gt' | 'range' | 'multiple'

type TValue = CalendarProps['modelValue']

const DATE_FILTER_MODE_ITEMS: { label: string; value: TDateFilterMode }[] = [
  { label: 'Exact', value: 'eq' },
  { label: 'Less than', value: 'lt' },
  { label: 'Less than or equal to', value: 'lte' },
  { label: 'Greater than or equal to', value: 'gte' },
  { label: 'Greater than', value: 'gt' },
  { label: 'Range', value: 'range' },
  { label: 'Multiple', value: 'multiple' }
]

export type TFilterDateProps = CalendarProps & {
  mode?: TDateFilterMode
  label?: string
  dense?: boolean
}

const props = withDefaults(defineProps<TFilterDateProps>(), {
  mode: 'eq',
  dense: false
})

const emit = defineEmits<{
  'update:mode': [mode?: TDateFilterMode]
  'update:modelValue': [value?: TValue]
}>()

const { mode: modelMode, modelValue } = toRefs(props)

const open = ref(false)
const filterMode = ref<TDateFilterMode>(modelMode.value)
const value = ref<any>(modelValue.value)

const modeKind = (m: TDateFilterMode) => {
  if (m === 'range') return 'range'
  if (m === 'multiple') return 'multiple'
  return 'single'
}

const onUpdateMode = (v?: TDateFilterMode) => {
  if (!v) return
  if (modeKind(v) !== modeKind(filterMode.value)) {
    value.value = undefined
  }
  filterMode.value = v
}

const onClear = () => {
  value.value = undefined
  emit('update:mode', undefined)
  emit('update:modelValue', undefined)
  open.value = false
}

const onApply = () => {
  if (!value.value) return
  emit('update:mode', filterMode.value)
  emit('update:modelValue', value.value)
  open.value = false
}

watch(modelValue, v => {
  if (!v) return
  if (v == value.value) return
  value.value = v
})

watch(modelMode, v => {
  if (filterMode.value !== v) {
    filterMode.value = v
  }
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
      <USelect
        :model-value="filterMode"
        :items="DATE_FILTER_MODE_ITEMS"
        size="sm"
        class="w-full"
        @update:model-value="onUpdateMode"
      />
      <UCalendar
        v-model="value"
        :range="filterMode === 'range'"
        :multiple="filterMode === 'multiple'"
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
