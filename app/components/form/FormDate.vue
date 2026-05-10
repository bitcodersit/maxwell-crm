<script setup lang="ts">
import type { CalendarProps, InputProps } from '@nuxt/ui'
import { parseDate } from '@internationalized/date'
import { format as df } from 'date-fns'

type TValue = CalendarProps['modelValue']
type TMode = 'single' | 'range' | 'multiple'
type TTrigger = 'input' | 'button'
type TModelValue = TValue | string | Date | null

export type TFormDateProps = Omit<CalendarProps, 'modelValue'> & {
  mode?: TMode
  showMode?: boolean
  trigger?: TTrigger
  triggerLabel?: string
  triggerPlaceholder?: string
  triggerProps?: Partial<InputProps>
  closeOnSelect?: boolean
  displayFormat?: string
  outputFormat?: string
}

const props = withDefaults(defineProps<TFormDateProps>(), {
  mode: 'single',
  showMode: false,
  trigger: 'input',
  triggerPlaceholder: 'Pick a date',
  closeOnSelect: true,
  displayFormat: 'MMM dd yyyy',
  outputFormat: 'yyyy-MM-dd'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value?: TModelValue): void
  (e: 'update:mode', mode?: TMode): void
}>()

const model = defineModel<TModelValue>()
const modeModel = defineModel<TMode>('mode')

const open = ref(false)
const mode = ref<TMode>(modeModel.value ?? props.mode)
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

const toOutputValue = (next?: any): TModelValue | undefined => {
  if (!next) return undefined
  if (mode.value !== 'single') return next

  const iso = getIsoDate(next as any)
  if (!iso) return undefined

  if (model.value instanceof Date) {
    return getDateFromIso(iso)
  }

  const date = getDateFromIso(iso)
  if (!date) return undefined
  return df(date, props.outputFormat)
}

value.value = toCalendarValue(model.value)

const displayValue = computed<string | undefined>(() => {
  const iso = getIsoDate(model.value as any)
  if (!iso) return undefined
  const date = getDateFromIso(iso)
  return date ? df(date, props.displayFormat) : undefined
})

const inputTriggerProps = computed(() => {
  const raw = (props.triggerProps || {}) as Record<string, unknown>
  const { modelValue: _modelValue, ...rest } = raw
  return rest
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
    v-model:open="open"
    :arrow="true"
    :ui="{ content: 'p-3 flex flex-col gap-3' }"
    :content="{ align: 'start', side: 'bottom' }"
  >
    <slot
      name="trigger"
      :open="open"
      :display-value="displayValue"
    >
      <UInput
        v-if="trigger === 'input'"
        :model-value="displayValue || ''"
        readonly
        :placeholder="triggerPlaceholder"
        v-bind="inputTriggerProps"
        class="w-full cursor-pointer"
        @click="open = true"
      />
      <UButton
        v-else
        icon="i-lucide-calendar"
        variant="soft"
        color="neutral"
        @click="open = true"
      >
        {{ triggerLabel || displayValue || triggerPlaceholder }}
      </UButton>
    </slot>

    <template #content>
      <URadioGroup
        v-if="showMode"
        v-model="mode"
        orientation="horizontal"
        @change="value = undefined"
        :items="[
          { label: 'Single', value: 'single' },
          { label: 'Range', value: 'range' },
          { label: 'Multiple', value: 'multiple' }
        ]"
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
      </div>
    </template>
  </UPopover>
</template>
