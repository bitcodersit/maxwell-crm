<script setup lang="ts">
defineProps<{
  src?: string
  title?: string
}>()
</script>

<template>
  <UModal
    :title="title"
    :ui="{ body: 'sm:p-0', content: 'max-w-full w-full max-h-screen h-screen sm:max-h-screen' }"
  >
    <template #body>
      <iframe
        :src="src"
        width="100%"
        height="100%"
      />
    </template>
  </UModal>
</template>
