<script setup lang="ts">
import type { TLeadFormState } from '@/utils/leads-form'
import {
  createEmptyLeadFormState,
  toLeadCreatePayload
} from '@/utils/leads-form'

definePageMeta({
  title: 'Add Lead'
})

const router = useRouter()
const toast = useToast()
const client = useQueryClient()
const formRef = useTemplateRef('formRef')

const form = ref<TLeadFormState>(createEmptyLeadFormState())
const pendingFiles = ref<File[]>([])
const isSubmitting = ref(false)

const { mutateAsync: uploadAttachments } = useAttachmentsMutation()

async function onSubmit(state: TLeadFormState) {
  isSubmitting.value = true
  try {
    const lead = await $fetch<TLead>('/api/leads', {
      method: 'POST',
      body: toLeadCreatePayload(state)
    })

    if (pendingFiles.value.length) {
      await uploadAttachments({
        files: pendingFiles.value,
        folder: 'leads',
        attachableId: lead.attachableId ?? undefined,
        attachableModelId: lead.id,
        attachableModelType: 'lead'
      })
    }

    client.invalidateQueries({ queryKey: ['/api/leads'] })
    client.invalidateQueries({ queryKey: ['/api/boards/find'] })

    if (lead.boardItems?.[0]) {
      client.invalidateQueries({
        queryKey: [
          `/api/board-items`,
          {
            columnId: lead.boardItems[0].columnId
          }
        ]
      })
    }

    toast.add({ title: 'Lead created', color: 'success' })
    await router.push(`/leads/${lead.sid}`)
  } catch (error) {
    const { message, errors } = parseError(error)
    if (errors?.length) formRef.value?.setErrors(errors)
    else {
      toast.add({
        title: 'Failed to create lead',
        description: message,
        color: 'error'
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto scrollbar">
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <div class="flex items-center gap-3">
        <UButton
          icon="i-lucide-arrow-left"
          color="neutral"
          variant="ghost"
          to="/leads"
        />
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">
            Add New Lead
          </h1>
          <p class="text-sm text-muted mt-1">
            Create a lead, assign users or teams, and queue documents to upload on save.
          </p>
        </div>
      </div>

      <UPageCard>
        <LeadForm
          ref="formRef"
          v-model="form"
          v-model:pending-files="pendingFiles"
          upload-mode="pending"
          @submit="onSubmit"
        >
          <template #actions>
            <UButton
              type="button"
              color="neutral"
              variant="subtle"
              to="/leads"
              :disabled="isSubmitting"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-plus"
              :loading="isSubmitting"
            >
              Create lead
            </UButton>
          </template>
        </LeadForm>
      </UPageCard>
    </div>
  </div>
</template>
