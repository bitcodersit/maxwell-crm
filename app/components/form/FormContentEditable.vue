<script setup lang="ts">
const props = withDefaults(
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
  (e: 'blur', value: string): void
}>()

const ready = ref(false)
onMounted(() => {
  ready.value = true
})

const isEditable = computed(() => ready.value && !props.disabled)

const onBlur = (event: Event) => {
  const next = (event.target as HTMLElement).textContent?.trim() || ''
  model.value = next
  emit('blur', next)
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
    :role="isEditable ? 'textbox' : undefined"
    :aria-label="isEditable ? 'Target name' : undefined"
    :contenteditable="isEditable ? 'true' : 'false'"
    @blur="onBlur"
  >
    {{ model }}
  </component>
</template>
