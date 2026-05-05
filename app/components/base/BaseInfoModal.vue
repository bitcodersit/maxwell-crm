<script setup lang="ts">
export type TInfoModalProps = {
  title?: string
  description?: string
  body?: string | VNode
  class?: string
}
withDefaults(defineProps<TInfoModalProps>(), {
  title: 'Info Modal',
})
</script>

<template>
  <UModal :title="title" :description="description">
    <template #body>
      <div :class="class" v-if="typeof body === 'string'">
        {{ body }}
      </div>
      <component :is="body" v-else />
    </template>
  </UModal>
</template>
