<script setup lang="ts">
import type { TLeadFormState } from '@/utils/leads-form'
import { leadToFormState, toLeadUpdatePayload } from '@/utils/leads-form'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lead: TLead
  attachments?: TAttachment[]
}>()

const emit = defineEmits<{
  success: []
  refreshAttachments: []
}>()

const formRef = useTemplateRef('formRef')
const toast = useToast()

const form = ref<TLeadFormState>(leadToFormState())
const pendingFiles = ref<File[]>([])

watch(open, isOpen => {
  if (isOpen) form.value = leadToFormState(props.lead)
})

watch(
  () => props.lead,
  lead => {
    if (open.value) form.value = leadToFormState(lead)
  }
)

const { mutate, isPending } = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    $fetch<TLead>(`/api/leads/${props.lead.id}`, {
      method: 'PATCH',
      body
    })
})

function onSubmit(state: TLeadFormState = form.value) {
  mutate(toLeadUpdatePayload(state, props.lead), {
    onSuccess() {
      toast.add({ title: 'Lead updated', color: 'success' })
      open.value = false
      emit('success')
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else {
        formRef.value?.setErrors([{ name: 'status', message }])
        toast.add({
          title: 'Failed to update lead',
          description: message,
          color: 'error'
        })
      }
    }
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit lead"
    description="Update lead details, assign users or teams, and manage documents."
    :ui="{ content: 'max-w-3xl w-full' }"
  >
    <template #body>
      <LeadForm
        ref="formRef"
        v-model="form"
        v-model:pending-files="pendingFiles"
        upload-mode="upload"
        :lead-id="lead.id"
        :attachable-id="lead.attachableId"
        :attachments="attachments ?? lead.attachable?.attachments ?? []"
        :disabled="isPending"
        @submit="onSubmit"
        @refresh-attachments="emit('refreshAttachments')"
      >
        <template #actions>
          <UButton
            type="button"
            color="neutral"
            variant="subtle"
            :disabled="isPending"
            @click="open = false"
          >
            Cancel
          </UButton>
          <UButton
            type="button"
            icon="i-lucide-save"
            :loading="isPending"
            @click="onSubmit()"
          >
            Save changes
          </UButton>
        </template>
      </LeadForm>
    </template>
  </UModal>
</template>
