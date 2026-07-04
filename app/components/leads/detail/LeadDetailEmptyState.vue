<script setup lang="ts">
defineProps<{
  icon?: string
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div
      class="flex items-center justify-center size-14 rounded-full bg-elevated mb-4"
    >
      <UIcon
        :name="icon || 'i-lucide-inbox'"
        class="size-7 text-muted"
      />
    </div>
    <h3 class="text-base font-medium text-highlighted">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-1 text-sm text-muted max-w-sm"
    >
      {{ description }}
    </p>
    <slot />
  </div>
</template>
