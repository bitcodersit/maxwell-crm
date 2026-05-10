<script setup lang="ts">
import type { Ref } from 'vue'
import type { Options as SortableOptions } from 'sortablejs'
import { useSortable } from '@vueuse/integrations/useSortable'

export type TTaskItemRow = {
  id: number
  text: string
  done: boolean
}

const props = withDefaults(
  defineProps<{
    variant?: 'form' | 'detail'
    /** When true, completing moves the row to the bottom (task list modal checklist UX). */
    moveDoneToEnd?: boolean
    /** When true, removing the last row resets it to one empty placeholder row. */
    keepAtLeastOneRow?: boolean
    metaText?: (row: TTaskItemRow) => string | undefined
    sortable?: boolean
  }>(),
  {
    variant: 'form',
    moveDoneToEnd: false,
    keepAtLeastOneRow: false,
    sortable: true
  }
)

const model = defineModel<TTaskItemRow[]>({ required: true })

const emit = defineEmits<{
  toggle: [payload: { row: TTaskItemRow; done: boolean }]
  reorder: [payload: { rows: TTaskItemRow[] }]
  'commit-text': [payload: { row: TTaskItemRow; text: string }]
  remove: [payload: { row: TTaskItemRow }]
  add: []
}>()

const listRef = ref<HTMLElement | null>(null)

if (props.sortable) {
  const sortableOpts: SortableOptions = {
    handle: '.task-items__handle',
    animation: 150,
    onEnd() {
      emit('reorder', { rows: [...model.value] })
    }
  }
  useSortable(listRef, model as Ref<TTaskItemRow[]>, sortableOpts)
}

function onToggle(index: number, value: boolean | 'indeterminate') {
  const done = value === true
  const row = model.value[index]
  if (!row) return

  const next = [...model.value]
  next[index] = { ...row, done }

  if (props.moveDoneToEnd && done) {
    const [moved] = next.splice(index, 1)
    if (moved) next.push(moved)
  }

  model.value = next
  const after = model.value.find(r => r.id === row.id)
  if (after) emit('toggle', { row: after, done })
}

function onRemove(index: number) {
  const row = model.value[index]
  if (!row) return

  if (props.keepAtLeastOneRow && model.value.length <= 1) {
    const prev = row
    model.value = [{ id: -Date.now(), text: '', done: false }]
    if (prev.id > 0) emit('remove', { row: prev })
    return
  }

  model.value = model.value.filter((_, i) => i !== index)
  emit('remove', { row })
}

function onTextBlur(index: number) {
  const row = model.value[index]
  if (!row) return
  emit('commit-text', { row, text: row.text })
}

const rowWrapClass = computed(() =>
  props.variant === 'detail'
    ? 'flex flex-1 flex-col gap-1 rounded-md border border-default bg-default/30 p-3'
    : 'group flex flex-1 items-center gap-2 rounded-lg border border-default bg-elevated/50 px-3 py-2'
)

const outerClass = computed(() =>
  props.variant === 'detail' ? 'flex items-start gap-2' : 'flex items-center gap-2'
)
</script>

<template>
  <div
    ref="listRef"
    class="space-y-2"
  >
    <div
      v-for="(row, index) in model"
      :key="row.id"
      :class="outerClass"
    >
      <UButton
        v-if="sortable"
        size="sm"
        icon="i-lucide-grip-vertical"
        color="neutral"
        variant="ghost"
        :ui="{ leadingIcon: 'text-muted/50' }"
        class="task-items__handle mt-0.5 cursor-grab flex-none active:cursor-grabbing"
        tabindex="-1"
      />

      <div :class="rowWrapClass">
        <div class="flex items-center gap-2">
          {{ row.sortOrder }}
          <UCheckbox
            :model-value="row.done"
            @update:model-value="onToggle(index, $event)"
          />
          <UInput
            v-model="row.text"
            placeholder="Add next requirement..."
            class="flex-1"
            variant="none"
            :ui="{ base: variant === 'form' ? 'px-0' : '' }"
            :class="variant === 'detail' && row.done ? 'line-through text-muted' : ''"
            @blur="onTextBlur(index)"
          />
          <UButton
            v-if="model.length"
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            :class="
              variant === 'form' ? 'opacity-0 transition-opacity group-hover:opacity-100' : ''
            "
            @click="onRemove(index)"
          />
        </div>
        <p
          v-if="variant === 'detail' && metaText?.(row)"
          class="text-xs text-muted"
        >
          {{ metaText(row) }}
        </p>
      </div>
    </div>
  </div>
</template>
