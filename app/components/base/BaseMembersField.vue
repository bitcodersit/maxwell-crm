<script setup lang="ts">
import type { InputProps } from '@nuxt/ui'
import type { TBaseSearchboxProps } from './BaseSearchbox.vue'

type TUserOption = {
  id: number
  name?: string
  avatarId?: number | null
}

type TMemberSelectField = {
  name: string
  type?: 'select'
  class?: string
  items: Array<{ label: string; value: any }>
}

type TMemberInputField = {
  name: string
  type: 'input'
  class?: string
  props?: InputProps
  defaultValue?: string
}

type TMemberField = TMemberSelectField | TMemberInputField

export type TMemberValue = {
  userId: number
  user?: TUserOption
  [key: string]: any
}

export type TBaseMembersFieldProps = Partial<
  Omit<TBaseSearchboxProps<TUserOption, number>, 'api' | 'query' | 'getValue' | 'getLabel'>
> & {
  fields?: TMemberField[]
}

const props = withDefaults(defineProps<TBaseMembersFieldProps>(), {
  fields: () => [],
  placeholder: 'Search user',
})

const model = defineModel<TMemberValue[]>({ default: () => [] })

const UAvatar = resolveComponent('UAvatar')
const { getAttachment } = useGetAttachment()

const getDefaultFieldValues = () => {
  return props.fields.reduce<Record<string, any>>((acc, field) => {
    if (field.type === 'input') {
      acc[field.name] = field.defaultValue || ''
      return acc
    }
    acc[field.name] = field.items[0]?.value
    return acc
  }, {})
}

const selectedUsers = computed<TUserOption[]>({
  get() {
    return model.value
      .map((member) => member.user)
      .filter((user): user is TUserOption => !!user && typeof user.id === 'number')
  },
  set(users) {
    const previous = new Map(model.value.map((member) => [member.userId, member]))
    model.value = users.map((user) => {
      const existing = previous.get(user.id)
      const base = existing ? { ...existing } : getDefaultFieldValues()
      return {
        ...base,
        userId: user.id,
        user,
      }
    })
  },
})

const getLabel = (user: TUserOption) => {
  return h('div', { class: 'flex items-center gap-2' }, [
    h(UAvatar, {
      size: '2xs',
      src: getAttachment(user.avatarId || undefined),
      alt: user.name,
    }),
    h('span', user.name || `User #${user.id}`),
  ])
}

const removeMember = (userId: number) => {
  model.value = model.value.filter((member) => member.userId !== userId)
}
</script>

<template>
  <BaseSearchbox
    v-model="selectedUsers"
    :size="size"
    :class="class"
    :api="'/api/users'"
    :query="{ options: true }"
    :get-label="getLabel"
    :get-value="(v) => v.id"
  />
  <div v-if="model.length" class="space-y-1 mt-3">
    <div
      v-for="member in model"
      :key="member.userId"
      class="flex items-center justify-between rounded-md border border-default px-3 py-2 gap-3"
    >
      <div class="flex items-center gap-2 min-w-0">
        <UAvatar
          size="2xs"
          :src="getAttachment(member.user?.avatarId || undefined)"
          :alt="member.user?.name"
        />
        <span class="truncate">{{ member.user?.name || `User #${member.userId}` }}</span>
      </div>
      <div class="flex items-center gap-2">
        <template v-for="field in fields" :key="`${member.userId}:${field.name}`">
          <UInput
            v-if="field.type === 'input'"
            v-model="member[field.name]"
            :class="field.class || 'w-40'"
            v-bind="field.props"
          />
          <USelect
            v-else
            v-model="member[field.name]"
            :class="field.class || 'w-32'"
            :items="field.items"
          />
        </template>
        <UButton
          type="button"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          @click="removeMember(member.userId)"
        />
      </div>
    </div>
  </div>
</template>
