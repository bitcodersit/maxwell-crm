<script lang="ts">
export type TFilterInputProps = {
  mode?: string
  label?: string
  modeable?: boolean
  modelValue?: string
  placeholder?: string
}
</script>

<script setup lang="ts">
const props = defineProps<TFilterInputProps>()

const mModelValue = defineModel<string>({ default: '' })
const mMode = defineModel<string | undefined>('mode', { default: 'contains' })

const open = ref(false)

const innerMode = ref(mMode.value)
const innerModelValue = ref(mModelValue.value)

const onClear = () => {
  innerModelValue.value = ''
  mModelValue.value = ''
  if (props.modeable) {
    mMode.value = undefined
  }
  open.value = false
}

const onApply = () => {
  const v = innerModelValue.value?.trim()
  if (!v) return
  mModelValue.value = v
  if (props.modeable) {
    mMode.value = innerMode.value
  }
  open.value = false
}

watch(mModelValue, v => {
  if (v === innerModelValue.value) return
  innerModelValue.value = v
})

watch(mMode, v => {
  if (!v || v === innerMode.value) return
  innerMode.value = v
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
        size="sm"
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
        <template
          v-if="modelValue"
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
        v-if="modeable"
        v-model="innerMode"
        orientation="horizontal"
        :items="[
          { label: 'Contains', value: 'contains' },
          { label: 'Exact', value: 'exact' }
        ]"
      />
      <UInput
        v-model="innerModelValue"
        :autofocus="true"
        :placeholder="placeholder"
        @keyup.enter="onApply"
      />
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
          :disabled="!innerModelValue?.trim()"
          @click="onApply"
        >
          Apply
        </UButton>
      </div>
    </template>
  </UPopover>
</template>
