<script setup lang="ts">
const props = defineProps<{
  column: TBoardColumn
}>()

const emit = defineEmits<{
  update: [column: TBoardColumn]
  refetch: []
}>()

const { confirm } = useConfirm()
const info = useInfoModal()

const onRemove = async () => {
  if (props.column._count?.items ?? 0 > 0) {
    return info.open({
      title: `Cannot delete column`,
      body: `Column has items, please remove them first`
    })
  }
  confirm({
    title: 'Delete Column',
    description: `Are you sure you want to delete the column "${props.column.name}"? This action cannot be undone.`,
    onConfirm: async () => {
      return $fetch<TBoardColumn>(`/api/board-columns/${props.column.id}`, {
        method: 'DELETE'
      }).then(res => {
        emit('refetch')
        return res
      })
    }
  })
}

const onPinUnpin = () => {
  $fetch<TBoardColumn>('/api/board-columns', {
    method: 'POST',
    body: {
      id: props.column.id,
      pinned: !props.column.pinned
    }
  }).then(() => {
    emit('refetch')
  })
}

const menuItems = computed(() => {
  return [
    [
      {
        ...actions.update,
        onSelect: () => {
          emit('update', props.column)
        }
      },
      {
        icon: props.column.pinned ? 'i-lucide-pin-off' : 'i-lucide-pin',
        label: props.column.pinned ? 'Unpin Column' : 'Pin Column',
        onSelect: onPinUnpin
      }
    ],
    [
      {
        ...actions.delete,
        onSelect: onRemove
      }
    ]
  ]
})
</script>

<template>
  <div
    :data-column-id="column.id"
    :data-column-sort-order="column.sortOrder"
    :class="{
      'base-kanban-pinned': column.pinned
    }"
    class="flex-none w-96 flex flex-col overflow-hidden rounded-lg"
  >
    <!-- Header -->
    <div
      class="flex-none bg-elevated base-kanban-handle cursor-grab active:cursor-grabbing px-4 py-3 flex items-center gap-4 justify-between border-x border-t border-default rounded-t-lg"
    >
      <div class="flex items-center gap-2">
        <UIcon
          v-if="column.pinned"
          name="i-lucide-pin"
        />
        <div
          class="size-4 rounded-full"
          :style="{
            backgroundColor: column.color ? column.color : 'var(--color-border)'
          }"
        ></div>
        <div class="text-sm font-semibold text-highlighted truncate">
          {{ column.name }}
        </div>
        <UBadge
          :label="String(column._count?.items || 0)"
          size="sm"
          color="neutral"
          variant="subtle"
        />
      </div>
      <div class="flex items-center">
        <UButton
          icon="i-lucide-plus"
          size="sm"
          color="neutral"
          variant="soft"
        />
        <UDropdownMenu :items="menuItems">
          <UButton
            icon="i-lucide-ellipsis-vertical"
            size="sm"
            color="neutral"
            variant="soft"
          />
        </UDropdownMenu>
      </div>
    </div>
    <slot />
  </div>
</template>
