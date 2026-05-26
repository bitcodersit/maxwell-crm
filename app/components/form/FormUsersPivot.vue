<script context="module" lang="ts">
import type { TFormSearchboxProps } from './FormSearchbox.vue'
import type { SelectProps, InputProps } from '@nuxt/ui'

type TModelValue = {
  user: TUser
  userId: TUser['id']
  [key: string]: any
}

type TMemberSelectField = {
  name: string
  type?: 'select'
  props?: SelectProps
}

type TMemberInputField = {
  name: string
  type: 'input'
  props?: InputProps
}

type TMemberField = TMemberSelectField | TMemberInputField

export type TFormUsersPivotProps = Partial<
  Omit<TFormSearchboxProps<TUser, number>, 'api' | 'query' | 'getValue' | 'getLabel'>
> & {
  fields?: TMemberField[]
}
</script>

<script setup lang="ts" generic="ModelValue extends TModelValue">
const props = withDefaults(defineProps<TFormUsersPivotProps>(), {
  fields: () => [],
  placeholder: 'Search user'
})

const model = defineModel<ModelValue[]>({ default: () => [] })

const UAvatar = resolveComponent('UAvatar')
const { getAttachment } = useGetAttachment()

const selectedUsers = computed<TUser[]>({
  get() {
    return model.value.map(member => member.user)
  },
  set(users) {
    model.value = users.map(user => {
      const existing = model.value.find(m => m.userId === user.id)
      return { ...existing, user, userId: user.id } as ModelValue
    })
  }
})

const getLabel = (user: TUser) => {
  return h('div', { class: 'flex items-center gap-2' }, [
    h(UAvatar, {
      size: '2xs',
      class: 'bg-primary/20',
      src: getAttachment(user.avatar?.path || undefined),
      alt: user.name
    }),
    h('span', user.name || `User #${user.id}`)
  ])
}

const onRemoveItem = (item: ModelValue) => {
  model.value = model.value.filter(v => {
    return v.userId !== item.user.id
  })
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="item in model"
      :key="item.userId"
      class="flex items-center justify-between rounded-md border border-default px-3 py-2 gap-3"
    >
      <div class="flex items-center gap-2 min-w-0 flex-none">
        <UAvatar
          size="sm"
          class="bg-primary/20"
          :alt="item.user?.name"
          :ui="{ fallback: 'text-xs' }"
          :src="getAttachment(item.user?.avatar?.path || undefined)"
        />
        <span class="truncate">{{ item.user.name }}</span>
      </div>
      <div class="flex items-center gap-2 flex-none">
        <template
          v-for="field in fields"
          :key="`${item.userId}:${field.name}`"
        >
          <UInput
            v-if="field.type === 'input'"
            v-model="item[field.name]"
            v-bind="field.props"
          />
          <USelect
            v-else
            v-model="item[field.name]"
            v-bind="field.props"
          />
        </template>
        <UButton
          size="sm"
          color="error"
          type="button"
          icon="i-lucide-trash"
          variant="ghost"
          @click="onRemoveItem(item)"
        />
      </div>
    </div>
    <FormSearchbox
      v-model="selectedUsers"
      :size="size"
      :class="props.class"
      :api="'/api/users'"
      :query="{ options: true }"
      :get-label="getLabel"
      :get-value="v => v.id"
      :placeholder="placeholder"
    />
  </div>
</template>
