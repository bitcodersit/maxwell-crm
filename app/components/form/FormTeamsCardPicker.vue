<script lang="ts">
import type { TFormCardPickerProps } from './FormCardPicker.vue'

export type TFormTeamsCardPickerProps = Partial<
  Omit<TFormCardPickerProps<TTeam, number>, 'api' | 'query' | 'getValue' | 'getLabel'>
>
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<TFormTeamsCardPickerProps>(), {
  modalTitle: 'Assign teams',
  searchPlaceholder: 'Search teams...',
  removeConfirm: 'Are you sure you want to remove this team?',
  saveConfirm: 'Are you sure you want to save the selected teams?',
  orderByItems: () => [
    { label: 'Name', value: 'name' },
    { label: 'Id', value: 'id' }
  ]
})

const model = defineModel<Pick<TTeam, 'id' | 'name'>[]>({ default: () => [] })

const pickerProps = computed(() => {
  const { modelValue, ...rest } = props as any
  return rest
})
</script>

<template>
  <FormCardPicker
    v-model="model"
    v-bind="pickerProps"
    api="/api/teams"
    :query="{ options: true }"
    :get-value="v => v.id"
    :get-label="v => v.name"
  >
    <template #selected-item="{ item }">
      <div class="flex flex-col items-center justify-center gap-1.5 min-w-0 w-full">
        <UAvatar
          size="md"
          class="bg-primary/20"
          icon="i-lucide-users"
          :alt="item.name"
          :ui="{ fallback: 'text-xs' }"
        />
        <span class="text-xs text-center truncate w-full px-1">
          {{ item.name || `Team #${item.id}` }}
        </span>
      </div>
    </template>
    <template #option-item="{ item }">
      <UAvatar
        size="sm"
        class="bg-primary/20 flex-none"
        icon="i-lucide-users"
        :alt="item.name"
        :ui="{ fallback: 'text-xs' }"
      />
      <span class="truncate text-sm">{{ item.name || `Team #${item.id}` }}</span>
    </template>
  </FormCardPicker>
</template>
