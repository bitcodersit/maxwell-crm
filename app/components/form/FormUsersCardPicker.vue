<script lang="ts">
import type { TFormCardPickerProps } from './FormCardPicker.vue'

export type TFormUsersCardPickerProps = Partial<
  Omit<TFormCardPickerProps<TUser, number>, 'api' | 'query' | 'getValue' | 'getLabel'>
>
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<TFormUsersCardPickerProps>(), {
  modalTitle: 'Assign users',
  searchPlaceholder: 'Search users...',
  removeConfirm: 'Are you sure you want to remove this user?',
  saveConfirm: 'Are you sure you want to save the selected users?',
  orderByItems: () => [
    { label: 'Name', value: 'name' },
    { label: 'Email', value: 'email' },
    { label: 'Id', value: 'id' }
  ]
})

const model = defineModel<Pick<TUser, 'id' | 'name'>[]>({ default: () => [] })
const open = defineModel<boolean>('open', { default: false })
const { getAttachment } = useGetAttachment()

const pickerProps = computed(() => {
  const { modelValue, open: _open, ...rest } = props as any
  return rest
})
</script>

<template>
  <FormCardPicker
    v-model="model"
    v-model:open="open"
    v-bind="pickerProps"
    api="/api/users"
    :query="{ options: true }"
    :get-value="v => v.id"
    :get-label="v => v.name"
  >
    <template
      v-if="$slots.trigger"
      #trigger="scope"
    >
      <slot
        name="trigger"
        v-bind="scope"
      />
    </template>
    <template #selected-item="{ item }">
      <div class="flex flex-col items-center justify-center gap-1.5 min-w-0 w-full">
        <UAvatar
          size="md"
          class="bg-primary/20"
          :alt="item.name"
          :ui="{ fallback: 'text-xs' }"
          :src="getAttachment((item as TUser).avatar?.path || undefined)"
        />
        <span class="text-xs text-center truncate w-full px-1">
          {{ item.name || `User #${item.id}` }}
        </span>
      </div>
    </template>
    <template #option-item="{ item }">
      <UAvatar
        size="sm"
        class="bg-primary/20 flex-none"
        :alt="item.name"
        :ui="{ fallback: 'text-xs' }"
        :src="getAttachment((item as TUser).avatar?.path || undefined)"
      />
      <span class="truncate text-sm">{{ item.name || `User #${item.id}` }}</span>
    </template>
  </FormCardPicker>
</template>
