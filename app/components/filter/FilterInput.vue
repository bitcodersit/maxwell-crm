<script setup lang="ts">
export type TFilterInputProps = {
  mode?: string
  label?: string
  modeable?: boolean
  modelValue?: string
  placeholder?: string
}

const props = defineProps<TFilterInputProps>()

const emit = defineEmits<{
  (e: 'update:mode', mode?: string): void
  (e: 'update:modelValue', value?: string): void
}>()

const { mode: modelMode, modelValue, modeable } = toRefs(props)

const open = ref(false)

const value = ref(modelValue.value)
const mode = ref(modelMode.value ?? 'contains')

const onClear = () => {
  value.value = ''
  emit('update:modelValue', undefined)
  if (modeable.value) {
    emit('update:mode', undefined)
  }
  open.value = false
}

const onApply = () => {
  const v = value.value?.trim()
  if (!v) return
  emit('update:modelValue', v)
  if (modeable.value) {
    emit('update:mode', mode.value)
  }
  open.value = false
}

watch(modelValue, (v) => {
  if (v === value.value) return
  value.value = v
})

watch(modelMode, (v) => {
  if (v === mode.value) return
  mode.value = v ?? 'contains'
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
        @click:trailing="onClear"
        @click="open = true"
      >
        {{ label ?? 'Text' }}
        <template v-if="modelValue"> | </template>
        <template v-if="modelValue && modeable"> {{ mode }} |</template>
        {{ modelValue }}
        <template v-if="modelValue" #trailing>
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
        v-if="modeable"
        v-model="mode"
        orientation="horizontal"
        :items="[
          { label: 'Contains', value: 'contains' },
          { label: 'Exact', value: 'exact' },
        ]"
      />
      <UInput v-model="value" :autofocus="true" :placeholder="placeholder" @keyup.enter="onApply" />
      <div class="flex items-center gap-2 justify-end">
        <UButton
          v-if="modelValue"
          icon="i-lucide-x"
          size="sm"
          color="error"
          variant="subtle"
          @click="onClear"
        >
          Clear
        </UButton>
        <UButton
          icon="i-lucide-check"
          color="primary"
          variant="solid"
          size="sm"
          :disabled="!value?.trim()"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
