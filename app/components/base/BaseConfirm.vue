<script setup lang="ts">
export type TConfirmProps = {
  title?: string
  description?: string
  cancelLabel?: string
  confirmLabel?: string
  onConfirm?: () => Promise<any>
}

const props = withDefaults(defineProps<TConfirmProps>(), {
  title: 'Confirm',
  description: 'Are you sure you want to do this?',
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm'
})

const emit = defineEmits<{
  close: [boolean]
}>()

const loading = ref(false)
const onConfirm = async () => {
  if (!props.onConfirm) {
    emit('close', true)
    return
  }
  loading.value = true
  await props.onConfirm?.()
  loading.value = false
  emit('close', true)
}
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton
        color="error"
        :label="confirmLabel"
        :loading="loading"
        @click="onConfirm"
      />
      <UButton
        color="neutral"
        :label="cancelLabel"
        @click="emit('close', false)"
      />
    </template>
  </UModal>
</template>
