<script setup lang="ts">
export type TConfirmProps = {
  title?: string
  description?: string
  cancelLabel?: string
  confirmLabel?: string
}

withDefaults(defineProps<TConfirmProps>(), {
  title: 'Confirm',
  description: 'Are you sure you want to do this?',
  cancelLabel: 'Cancel',
  confirmLabel: 'Confirm',
})

const emit = defineEmits<{
  close: [boolean]
}>()
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    :close="{ onClick: () => emit('close', false) }"
    :ui="{ footer: 'justify-end' }"
  >
    <template #footer>
      <UButton color="error" :label="confirmLabel" @click="emit('close', true)" />
      <UButton color="neutral" :label="cancelLabel" @click="emit('close', false)" />
    </template>
  </UModal>
</template>
