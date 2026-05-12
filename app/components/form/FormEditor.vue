<script setup lang="ts">
import type { EditorContentType, EditorToolbarItem } from '@nuxt/ui'

withDefaults(
  defineProps<{
    placeholder?: string
    contentType?: EditorContentType
    minHeightClass?: string
    contentClass?: string
    borderClass?: string
    editable?: boolean
  }>(),
  {
    editable: true,
    contentClass: '',
    placeholder: 'Start writing...',
    contentType: 'markdown',
    minHeightClass: 'min-h-32',
    borderClass: 'border-accented'
  }
)

const model = defineModel<TMaybe<string>>({ default: '' })

const toolbarItems = [
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Bold' }
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Italic' }
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      tooltip: { text: 'Underline' }
    }
  ],
  [
    {
      kind: 'bulletList',
      icon: 'i-lucide-list',
      tooltip: { text: 'Bullet List' }
    },
    {
      kind: 'orderedList',
      icon: 'i-lucide-list-ordered',
      tooltip: { text: 'Ordered List' }
    },
    {
      kind: 'blockquote',
      icon: 'i-lucide-text-quote',
      tooltip: { text: 'Quote' }
    },
    {
      kind: 'link',
      icon: 'i-lucide-link',
      tooltip: { text: 'Link' }
    }
  ],
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo',
      tooltip: { text: 'Undo' }
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo',
      tooltip: { text: 'Redo' }
    }
  ]
] satisfies EditorToolbarItem[][]
</script>

<template>
  <div
    class="overflow-hidden rounded-lg border bg-default/20"
    :class="[borderClass, minHeightClass]"
  >
    <UEditor
      v-slot="{ editor }"
      v-model="model"
      :content-type="contentType"
      :placeholder="placeholder"
      :editable="editable"
      :ui="{
        base: ['px-3 py-2 text-sm', minHeightClass],
        content: ['[&>div]:px-3 [&>div]:py-2', contentClass]
      }"
      class="w-full"
    >
      <UEditorToolbar
        v-if="editable"
        :editor="editor"
        :items="toolbarItems"
        class="border-b p-2"
        :class="borderClass"
      />
    </UEditor>
  </div>
</template>
