<script setup lang="ts">
import type { CalendarProps, InputProps } from '@nuxt/ui'
import { parseDate } from '@internationalized/date'
import { format as df } from 'date-fns'

type TValue = CalendarProps['modelValue']
type TMode = 'single' | 'range' | 'multiple'
type TModelValue = TValue | string | Date | null

export type TFormDateProps = Omit<CalendarProps, 'modelValue' | 'placeholder'> &
  Pick<InputProps, 'size' | 'placeholder'> & {
    showMode?: boolean
    outputFormat?: string
    displayFormat?: string
    closeOnSelect?: boolean
    disabled?: boolean
  }

const props = withDefaults(defineProps<TFormDateProps>(), {
  showMode: false,
  placeholder: 'Pick a date',
  outputFormat: 'yyyy-MM-dd',
  displayFormat: 'MMM dd yyyy',
  closeOnSelect: true
})

const emit = defineEmits<{
  'update:mode': [mode?: TMode]
  'update:modelValue': [value?: TModelValue]
}>()

const model = defineModel<TModelValue>()
const modeModel = defineModel<TMode>('mode', {
  default: 'single'
})

const open = ref(false)
const mode = ref<TMode>(modeModel.value)
const value = ref<any>()

const getIsoDate = (input?: TModelValue | any) => {
  if (!input) return undefined
  if (typeof input === 'string') return input.slice(0, 10)
  if (input instanceof Date) return df(input, 'yyyy-MM-dd')
  if (typeof input?.toString === 'function') {
    return input.toString().slice(0, 10)
  }
  return undefined
}

const getDateFromIso = (iso?: string) => {
  if (!iso) return undefined
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

const toCalendarValue = (input?: TModelValue) => {
  if (!input) return undefined
  if (mode.value !== 'single') return input as TValue
  const iso = getIsoDate(input)
  return iso ? (parseDate(iso) as TValue) : undefined
}

const toOutputValue = (next?: any): TModelValue | null => {
  if (!next) return null
  if (mode.value !== 'single') return next

  const iso = getIsoDate(next as any)
  if (!iso) return null

  if (model.value instanceof Date) {
    return getDateFromIso(iso)
  }

  const date = getDateFromIso(iso)
  if (!date) return null
  return df(date, props.outputFormat)
}

value.value = toCalendarValue(model.value)

const displayValue = computed<string | undefined>(() => {
  const iso = getIsoDate(model.value as any)
  if (!iso) return undefined
  const date = getDateFromIso(iso)
  return date ? df(date, props.displayFormat) : undefined
})

const setValue = (next?: any) => {
  value.value = next
  model.value = toOutputValue(next)
}

const onClear = () => {
  setValue(undefined)
  open.value = false
}

const onPick = (next?: any) => {
  setValue(next)
  if (props.closeOnSelect && mode.value === 'single' && next) {
    open.value = false
  }
}

const onSelect = () => {
  open.value = false
}

watch(model, v => {
  const next = toCalendarValue(v)
  if (next === value.value) return
  value.value = next
})

watch(modeModel, v => {
  if (!v || v === mode.value) return
  mode.value = v
})

watch(mode, v => {
  emit('update:mode', v)
  modeModel.value = v
})
</script>

<template>
  <UPopover
    :open="props.disabled ? false : open"
    :arrow="true"
    :ui="{ content: 'p-3 flex flex-col gap-3' }"
    :content="{ align: 'start', side: 'bottom' }"
    @update:open="open = $event"
  >
    <slot name="trigger">
      <span>
        <UInput
          :readonly="true"
          :model-value="displayValue || ''"
          :ui="{ base: 'text-left' }"
          :size="size"
          :placeholder="placeholder"
          :disabled="props.disabled"
          class="w-full cursor-pointer"
        />
      </span>
    </slot>
    <template #content>
      <URadioGroup
        v-if="showMode"
        v-model="mode"
        orientation="horizontal"
        :items="[
          { label: 'Single', value: 'single' },
          { label: 'Range', value: 'range' },
          { label: 'Multiple', value: 'multiple' }
        ]"
        @change="value = undefined"
      />
      <UCalendar
        :model-value="value"
        :range="mode === 'range'"
        :multiple="mode === 'multiple'"
        :min-value="minValue"
        @update:model-value="onPick"
      />
      <div class="flex items-center justify-end gap-2">
        <UButton
          v-if="model"
          icon="i-lucide-x"
          size="sm"
          color="error"
          variant="subtle"
          @click="onClear"
        >
          Clear
        </UButton>
        <UButton
          v-if="!closeOnSelect"
          :disabled="!value"
          icon="i-lucide-check"
          size="sm"
          @click="onSelect"
        >
          Select
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
