<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { FollowUpStatus, FollowUpType } from '~~/prisma/client/enums'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lead: TLead
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = useTemplateRef('formRef')
const toast = useToast()

const form = ref({
  type: FollowUpType.Call as FollowUpType,
  date: '',
  nextDate: '',
  outcome: '',
  status: FollowUpStatus.Pending as FollowUpStatus
})

const typeItems = computed(() =>
  Object.values(FollowUpType).map(value => ({
    label: value,
    value
  }))
)

const statusItems = computed(() =>
  Object.values(FollowUpStatus).map(value => ({
    label: formatLeadStatus(value),
    value
  }))
)

function resetForm() {
  form.value = {
    type: FollowUpType.Call,
    date: '',
    nextDate: '',
    outcome: '',
    status: FollowUpStatus.Pending
  }
}

watch(open, isOpen => {
  if (isOpen) resetForm()
})

const { mutate, isPending } = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    $fetch('/api/followups', {
      method: 'POST',
      body
    })
})

const onSubmit = (event: FormSubmitEvent<typeof form.value>) => {
  const payload: Record<string, unknown> = {
    leadId: props.lead.id,
    type: event.data.type,
    status: event.data.status,
    outcome: event.data.outcome?.trim() || undefined
  }

  if (event.data.date) payload.date = event.data.date
  if (event.data.nextDate) payload.nextDate = event.data.nextDate

  mutate(payload, {
    onSuccess() {
      toast.add({ title: 'Follow-up created', color: 'success' })
      open.value = false
      emit('success')
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'type', message }])
    }
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Add follow-up"
    description="Schedule a call, visit, or message for this lead."
    :ui="{ content: 'max-w-lg w-full' }"
  >
    <template #body>
      <UForm
        ref="formRef"
        :state="form"
        :disabled="isPending"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="type"
          label="Type"
          required
        >
          <USelect
            v-model="form.type"
            :items="typeItems"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="date"
          label="Follow-up date & time"
        >
          <UInput
            v-model="form.date"
            type="datetime-local"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="status"
          label="Status"
        >
          <USelect
            v-model="form.status"
            :items="statusItems"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="outcome"
          label="Notes"
        >
          <UTextarea
            v-model="form.outcome"
            :rows="3"
            size="lg"
            class="w-full"
            placeholder="Conversation notes or outcome"
          />
        </UFormField>

        <UFormField
          name="nextDate"
          label="Next follow-up"
        >
          <UInput
            v-model="form.nextDate"
            type="datetime-local"
            size="lg"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
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
            type="submit"
            icon="i-lucide-phone-forwarded"
            :loading="isPending"
          >
            Save follow-up
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
