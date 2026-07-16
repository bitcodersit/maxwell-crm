<script setup lang="ts">
const props = defineProps<{
  lead: TLead
  comments: TPaginated<TComment>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const formRef = useTemplateRef('formRef')
const toast = useToast()
const { confirm } = useConfirm()
const { user } = useCurrentUser()

const draft = ref('')
const editingId = ref<number | null>(null)
const editDraft = ref('')
const deletingId = ref<number | null>(null)

const items = computed(() => props.comments.data)

function canEdit(_item: TComment) {
  return canEditLeadDetailRecord(user.value)
}

function canDelete(item: TComment) {
  return canDeleteLeadDetailRecord(user.value, item.authorId, user.value?.deleteAnyComments)
}

const { mutate: createComment, isPending: isCreating } = useMutation({
  mutationFn: (text: string) =>
    $fetch('/api/comments', {
      method: 'POST',
      body: {
        text,
        commentableModelType: 'lead',
        commentableModelId: props.lead.id
      }
    })
})

const { mutate: updateComment, isPending: isUpdating } = useMutation({
  mutationFn: ({ id, text }: { id: number; text: string }) =>
    $fetch('/api/comments', {
      method: 'POST',
      body: { id, text }
    })
})

function startEdit(comment: TComment) {
  editingId.value = comment.id
  editDraft.value = comment.text
}

function cancelEdit() {
  editingId.value = null
  editDraft.value = ''
}

function onSubmit() {
  const text = draft.value.trim()
  if (!text) return

  createComment(text, {
    onSuccess() {
      toast.add({ title: 'Comment posted', color: 'success' })
      draft.value = ''
      emit('refresh')
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'text', message }])
    }
  })
}

function onSaveEdit(commentId: number) {
  const text = editDraft.value.trim()
  if (!text) return

  updateComment(
    { id: commentId, text },
    {
      onSuccess() {
        toast.add({ title: 'Comment updated', color: 'success' })
        cancelEdit()
        emit('refresh')
      },
      onError(error) {
        const { message } = parseError(error)
        toast.add({
          title: 'Failed to update comment',
          description: message,
          color: 'error'
        })
      }
    }
  )
}

async function onDelete(comment: TComment) {
  if (!(await confirm('Delete this comment?'))) return

  deletingId.value = comment.id
  try {
    await $fetch(`/api/comments/${comment.id}`, { method: 'DELETE' })
    toast.add({ title: 'Comment deleted', color: 'success' })
    if (editingId.value === comment.id) cancelEdit()
    emit('refresh')
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      title: 'Failed to delete comment',
      description: message,
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="pt-6 flex flex-col min-h-[420px]">
    <p class="text-sm text-muted mb-4">
      {{ comments.total }} comment{{ comments.total === 1 ? '' : 's' }}
    </p>

    <LeadDetailEmptyState
      v-if="!items.length"
      icon="i-lucide-messages-square"
      title="No comments yet"
      description="Add internal notes visible to your team on this lead."
    />

    <div
      v-else
      class="flex-1 space-y-4 overflow-y-auto scrollbar pr-1"
    >
      <div
        v-for="comment in items"
        :key="comment.id"
        class="flex gap-3"
      >
        <UAvatar
          :alt="comment.author?.name"
          :src="comment.author?.avatar?.path || undefined"
          size="sm"
          class="shrink-0 mt-0.5"
        />
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-baseline justify-between gap-2">
            <div class="flex flex-wrap items-baseline gap-2">
              <span class="text-sm font-medium text-highlighted">
                {{ comment.author?.name || 'Unknown' }}
              </span>
              <span class="text-xs text-muted">
                {{ $dfc(comment.createdAt) }}
              </span>
            </div>
            <div
              v-if="editingId !== comment.id && (canEdit(comment) || canDelete(comment))"
              class="flex items-center gap-1 shrink-0"
            >
              <UButton
                v-if="canEdit(comment)"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="startEdit(comment)"
              />
              <UButton
                v-if="canDelete(comment)"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="xs"
                :loading="deletingId === comment.id"
                @click="onDelete(comment)"
              />
            </div>
          </div>

          <template v-if="editingId === comment.id">
            <UTextarea
              v-model="editDraft"
              :rows="3"
              :disabled="isUpdating"
              class="w-full mt-2"
            />
            <div class="flex justify-end gap-2 mt-2">
              <UButton
                label="Cancel"
                color="neutral"
                variant="subtle"
                size="xs"
                :disabled="isUpdating"
                @click="cancelEdit"
              />
              <UButton
                label="Save"
                icon="i-lucide-save"
                size="xs"
                :loading="isUpdating"
                :disabled="!editDraft.trim()"
                @click="onSaveEdit(comment.id)"
              />
            </div>
          </template>
          <p
            v-else
            class="mt-1 text-sm text-default whitespace-pre-wrap"
          >
            {{ comment.text }}
          </p>

          <div
            v-if="comment.attachable?.attachments?.length"
            class="mt-2 flex flex-wrap gap-2"
          >
            <UBadge
              v-for="file in comment.attachable.attachments"
              :key="file.id"
              :label="file.name || 'Attachment'"
              color="neutral"
              variant="subtle"
              size="sm"
              icon="i-lucide-paperclip"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 pt-4 border-t border-default">
      <UForm
        ref="formRef"
        :state="{ text: draft }"
        class="space-y-2"
        @submit.prevent="onSubmit"
      >
        <UFormField name="text">
          <UTextarea
            v-model="draft"
            placeholder="Write an internal comment..."
            :rows="3"
            :disabled="isCreating"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end">
          <UButton
            label="Post comment"
            icon="i-lucide-send"
            :loading="isCreating"
            :disabled="!draft.trim()"
            type="submit"
          />
        </div>
      </UForm>
    </div>
  </div>
</template>
