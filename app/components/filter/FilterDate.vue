<script lang="ts">
import type { CalendarProps } from '@nuxt/ui'
import { parseDate } from '@internationalized/date'

type TModeSingle = 'lt' | 'lte' | 'eq' | 'gte' | 'gt'
type TModeRange = 'range'
type TModeMultiple = 'multiple'

type TModelSingle = {
  mode: TModeSingle
  value: TMaybe<string>
}

type TModelRange = {
  mode: TModeRange
  value: TMaybe<{
    start: string
    end: string
  }>
}

type TModelMultiple = {
  mode: TModeMultiple
  value: TMaybe<string[]>
}

type TMode = TModeSingle | TModeRange | TModeMultiple

type TInnerModel = {
  mode: TMode
  value: any
}

type TItem = {
  label: string
  value: TMode
}

const items: TItem[] = [
  { label: 'Exact', value: 'eq' },
  { label: 'Range', value: 'range' },
  { label: 'Multiple', value: 'multiple' },
  { label: 'Less than', value: 'lt' },
  { label: 'Less than or equal to', value: 'lte' },
  { label: 'Greater than or equal to', value: 'gte' },
  { label: 'Greater than', value: 'gt' }
]

const getDefault = () => ({
  mode: 'eq' as TMode,
  value: null
})

const toModel = ({ mode, value }: TInnerModel): TFilterDate => {
  if (mode === 'range') {
    return {
      mode,
      value: {
        start: value.start?.toString(),
        end: value.end?.toString()
      }
    }
  }
  if (mode === 'multiple') {
    return {
      mode,
      value: value.map((v: any) => v?.toString())
    }
  }
  return {
    mode,
    value: value?.toString()
  }
}

const toInnerModel = (v?: TFilterDate): TInnerModel => {
  const { mode, value } = v ?? getDefault()
  if (mode === 'range') {
    return {
      mode,
      value: {
        start: value?.start ? parseDate(value?.start) : null,
        end: value?.end ? parseDate(value?.end) : null
      }
    }
  }
  if (mode === 'multiple') {
    return {
      mode,
      value: Array.isArray(value) ? value.map(v => parseDate(v)) : null
    }
  }
  return {
    mode,
    value: value ? parseDate(value) : null
  }
}

export type TFilterDate = TModelSingle | TModelRange | TModelMultiple
export type TFilterDateProps = Omit<CalendarProps, 'modelValue' | 'range' | 'multiple'> & {
  label?: string
  dense?: boolean
}
</script>

<script setup lang="ts">
defineProps<TFilterDateProps>()

const open = ref(false)
const model = defineModel<TFilterDate>({})
const innerModel = ref<TInnerModel>(getDefault())

const getMode = (m: TMode) => {
  if (m === 'range') return 'range'
  if (m === 'multiple') return 'multiple'
  return 'single'
}

const onUpdateMode = (v?: TMode) => {
  if (!v) return
  if (getMode(v) !== getMode(innerModel.value.mode)) {
    innerModel.value.value = null
  }
  innerModel.value.mode = v
}

const onClear = () => {
  innerModel.value = getDefault()
  model.value = undefined
  open.value = false
}

const onApply = () => {
  if (!innerModel.value.value) return
  open.value = false
  model.value = toModel(innerModel.value)
}

watch(open, v => {
  if (!v) return
  innerModel.value = toInnerModel(model.value)
})

const disabled = computed(() => {
  const { mode, value } = innerModel.value
  if (mode === 'range') {
    return !value?.start || !value?.end
  }
  if (mode === 'multiple') {
    return !value || !value.length
  }
  return !value
})

const count = computed(() => {
  const { mode, value } = model.value || {}
  if (mode === 'range') {
    if (!value?.start && !value?.end) return null
    return value?.start && value?.end ? 2 : 1
  }
  if (mode === 'multiple') {
    return value?.length || null
  }
  return value ? 1 : null
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
      :show="!!model?.value"
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
        <template v-if="model?.value && !dense">
          | {{ model?.mode }}
          <UKbd size="sm">
            {{ count }}
          </UKbd>
        </template>
        <template
          v-if="model?.value && !dense"
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
        :model-value="innerModel.mode"
        :items="items"
        size="sm"
        class="w-full"
        @update:model-value="onUpdateMode"
      />
      <UCalendar
        v-model="innerModel.value"
        :range="innerModel.mode === 'range'"
        :multiple="innerModel.mode === 'multiple'"
      />
      <div class="flex items-center gap-2 justify-end">
        <UButton
          v-if="model?.value"
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
          :disabled="disabled"
          color="primary"
          variant="solid"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
