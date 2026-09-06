<script setup lang="ts">
withDefaults(
  defineProps<{
    name: string
    src?: string
    icon?: string
    count?: number
    disabled?: boolean
    removable?: boolean
  }>(),
  {
    removable: false
  }
)

const emit = defineEmits<{
  click: []
}>()

const expanded = ref(false)
</script>

<template>
  <div
    class="relative size-6 shrink-0"
    :class="expanded ? 'z-40' : 'z-10'"
    @mouseenter="expanded = true"
    @mouseleave="expanded = false"
  >
    <button
      type="button"
      class="absolute left-0 top-0 z-10 flex h-6 w-max items-center overflow-hidden rounded-full bg-elevated ring-2 ring-inverted/25 shadow-xs"
      :disabled="disabled"
      :aria-label="name"
      :aria-expanded="expanded"
      @click="emit('click')"
    >
      <span
        v-if="count != null"
        class="inline-flex size-6 shrink-0 items-center justify-center text-[10px] font-medium text-highlighted"
      >
        +{{ count }}
      </span>
      <UAvatar
        v-else
        :alt="name"
        :src="src"
        :icon="icon"
        size="xs"
        class="bg-elevated shrink-0"
        :ui="{
          root: 'bg-elevated',
          fallback: 'text-[10px] text-highlighted bg-elevated'
        }"
      />
      <span
        class="grid transition-[grid-template-columns,opacity] duration-200 ease-out"
        :class="expanded ? 'grid-cols-[1fr] opacity-100' : 'grid-cols-[0fr] opacity-0'"
      >
        <span class="min-w-0 overflow-hidden">
          <span
            class="flex items-center gap-1 pl-1 pr-1.5 text-xs font-medium text-highlighted whitespace-nowrap"
          >
            <span class="truncate max-w-24">{{ name }}</span>
            <UIcon
              v-if="removable && !disabled"
              name="i-lucide-x"
              class="size-3 text-error shrink-0"
            />
          </span>
        </span>
      </span>
    </button>
  </div>
</template>
