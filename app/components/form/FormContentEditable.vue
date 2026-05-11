<script setup lang="ts">
withDefaults(
  defineProps<{
    tag?: string
    class?: string
  }>(),
  {
    tag: 'div'
  }
)
const model = defineModel<string>({
  default: ''
})

const onBlur = (event: Event) => {
  const input = event.target as HTMLInputElement
  model.value = input.textContent.trim()
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
    :contenteditable="true"
    @blur="onBlur"
  >
    {{ model }}
  </component>
</template>
