<script setup lang="ts">
export type TInfoModalProps = {
  title?: string
  description?: string
  body?: string | VNode | ((v: { close: () => void }) => string | VNode)
  class?: string
}
withDefaults(defineProps<TInfoModalProps>(), {
  title: 'Info Modal',
})
</script>

<template>
  <UModal :title="title" :description="description">
    <template #body="props">
      <VNode :value="body ? (typeof body === 'function' ? body(props) : body) : undefined" />
    </template>
  </UModal>
</template>
