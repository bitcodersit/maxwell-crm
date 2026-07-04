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
const draft = ref('')

const items = computed(() => props.comments.data)

const { mutate, isPending } = useMutation({
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

const onSubmit = () => {
  const text = draft.value.trim()
  if (!text) return

  mutate(text, {
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
          <div class="flex flex-wrap items-baseline gap-2">
            <span class="text-sm font-medium text-highlighted">
              {{ comment.author?.name || 'Unknown' }}
            </span>
            <span class="text-xs text-muted">
              {{ $dfc(comment.createdAt) }}
            </span>
          </div>
          <p class="mt-1 text-sm text-default whitespace-pre-wrap">
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
            :disabled="isPending"
            class="w-full"
          />
        </UFormField>
        <div class="flex justify-end">
          <UButton
            label="Post comment"
            icon="i-lucide-send"
            :loading="isPending"
            :disabled="!draft.trim()"
            type="submit"
          />
        </div>
      </UForm>
    </div>
  </div>
</template>
