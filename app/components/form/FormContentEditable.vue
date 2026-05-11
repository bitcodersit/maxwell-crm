<script setup lang="ts">
withDefaults(
  defineProps<{
    tag?: string
    class?: string
    disabled?: boolean
  }>(),
  {
    tag: 'div'
  }
)
const model = defineModel<string>({
  default: ''
})

const emit = defineEmits<{
  (e: 'blur'): void
}>()

const onBlur = (event: Event) => {
  const input = event.target as HTMLInputElement
  model.value = input.textContent.trim()
  emit('blur')
}

const element = useTemplateRef<HTMLElement>('contentEditable')
watch(model, value => {
  if (element.value && element.value.textContent !== value) {
    element.value.textContent = value
  }
})
</script>

<template>
  <component
    ref="contentEditable"
    :is="tag"
    :class="class"
    :contenteditable="!disabled"
    @blur="onBlur"
  >
    {{ model }}
  </component>
</template>
