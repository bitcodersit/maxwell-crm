<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'
import { TaskItemStatus } from '~~/prisma/client/enums'

type TModel = Pick<
  TTaskItem,
  'id' | 'name' | 'status' | 'sortOrder' | 'completedAt' | 'completedBy' | 'completedById'
>

const { user } = useUserSession()
const { getAttachment } = useGetAttachment()

const model = defineModel<TModel[]>({
  default: () => []
})

const emit = defineEmits<{
  change: []
}>()

const listRef = ref<HTMLElement | null>(null)
useSortable(listRef, model, {
  disabled: !user.value?.can?.updateAnyTasks,
  filter: '.task-items__disabled',
  handle: '.task-items__handle',
  animation: 150,
  onEnd() {
    emit('change')
  }
})

const onFocusInput = () => {
  listRef.value?.querySelector('input')?.focus()
}

const onAddItem = () => {
  model.value.unshift({
    id: -Date.now(),
    name: '',
    status: TaskItemStatus.TODO,
    sortOrder: (model.value[0]?.sortOrder ?? 0) - 1,
    completedAt: null,
    completedById: null
  })
  nextTick(onFocusInput)
}

const onRemoveItem = (id: number) => {
  model.value = model.value.filter(v => v.id !== id)
  emit('change')
  nextTick(onFocusInput)
}

const onChangeCheckbox = (item: TModel, checked: boolean | 'indeterminate') => {
  item.status = checked ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO
  item.completedAt = checked ? new Date() : null
  item.completedBy = checked ? (user.value as TUser) : null
  item.completedById = checked ? (user.value as TUser).id : null
  model.value = model.value
    .sort((a, b) => {
      if (a.status === b.status) {
        return a.sortOrder - b.sortOrder
      }
      return a.status === TaskItemStatus.COMPLETED ? 1 : -1
    })
    .map((v, i) => ({
      ...v,
      sortOrder: i
    }))
  emit('change')
}

const completion = computed(() => {
  const done = model.value.filter(v => v.status === TaskItemStatus.COMPLETED).length
  const total = model.value.length
  return {
    done,
    total,
    percent: total ? Math.round((done / total) * 100) : 0
  }
})
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-4">
      <div class="text-sm text-muted">
        <span>Checklist</span>
        <span>
          {{ ` • ${completion.done} / ${completion.total} completed (${completion.percent}%)` }}
        </span>
      </div>
      <UButton
        v-if="!!user?.can?.updateAnyTasks"
        icon="i-lucide-plus"
        size="xs"
        variant="ghost"
        @click="onAddItem"
      >
        Add Item
      </UButton>
    </div>
    <UProgress
      :model-value="completion.percent"
      size="sm"
    />
    <div
      ref="listRef"
      class="space-y-2"
    >
      <div
        v-for="item in model"
        :key="item.id"
        :class="{
          'opacity-50': item.status === TaskItemStatus.COMPLETED,
          'task-items__disabled': item.status === TaskItemStatus.COMPLETED
        }"
        class="flex items-center gap-2"
      >
        <div class="flex-none w-7">
          <UButton
            v-if="item.status !== TaskItemStatus.COMPLETED"
            :ui="{ leadingIcon: 'text-muted/50' }"
            :disabled="!user?.can?.updateAnyTasks"
            size="sm"
            icon="i-lucide-grip-vertical"
            color="neutral"
            class="task-items__handle cursor-grab flex-none active:cursor-grabbing"
            variant="ghost"
            tabindex="-1"
          />
        </div>
        <div
          class="flex flex-1 gap-4 items-center rounded-md border border-default bg-default/30 p-3"
        >
          <UCheckbox
            :disabled="!item.name.trim().length"
            :model-value="item.status === TaskItemStatus.COMPLETED"
            @update:model-value="onChangeCheckbox(item, $event)"
          />
          <UInput
            v-if="item.status !== TaskItemStatus.COMPLETED && !!user?.can?.updateAnyTasks"
            v-model="item.name"
            placeholder="Add next requirement..."
            class="flex-1"
            variant="none"
            :ui="{ base: 'px-0 py-0 text-base' }"
            @blur="emit('change')"
          />
          <div
            v-else
            class="flex-1 text-base"
          >
            {{ item.name }}
          </div>
          <UTooltip
            v-if="item.completedBy"
            :delay-duration="0"
          >
            <UAvatar
              :size="'xs'"
              :src="getAttachment(item.completedBy.avatarId)"
              :alt="item.completedBy.name"
            />
            <template #content>
              Completed by <b>{{ item.completedBy.name }}</b> on
              <b>{{ $dfc(item.completedAt, 'dd MMM yyyy hh:mm a', 'NO DONE DATE') }}</b>
            </template>
          </UTooltip>
          <UButton
            v-if="
              model.length &&
              item.status !== TaskItemStatus.COMPLETED &&
              !!user?.can?.updateAnyTasks
            "
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            :ui="{ base: 'text-muted/50' }"
            @click="onRemoveItem(item.id)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
