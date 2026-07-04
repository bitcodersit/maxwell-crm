<script setup lang="ts">
const props = defineProps<{
  users?: Array<{ id: number; name: string; avatar?: { path?: string | null } | null }>
  max?: number
}>()

const visible = computed(() => (props.users ?? []).slice(0, props.max ?? 4))
const overflow = computed(() => Math.max(0, (props.users?.length ?? 0) - (props.max ?? 4)))
</script>

<template>
  <div
    v-if="visible.length"
    class="flex items-center -space-x-2"
  >
    <UTooltip
      v-for="user in visible"
      :key="user.id"
      :text="user.name"
    >
      <UAvatar
        :alt="user.name"
        :src="user.avatar?.path || undefined"
        size="sm"
        class="ring-2 ring-default"
      />
    </UTooltip>
    <span
      v-if="overflow > 0"
      class="inline-flex items-center justify-center size-8 rounded-full bg-elevated text-xs font-medium text-muted ring-2 ring-default"
    >
      +{{ overflow }}
    </span>
  </div>
  <span
    v-else
    class="text-sm text-muted"
  >—</span>
</template>
