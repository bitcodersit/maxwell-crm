<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { VisitStatus } from '~~/prisma/client/enums'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lead: TLead
  visit?: TVisit | null
}>()

const isEditMode = computed(() => !!props.visit)

const emit = defineEmits<{
  success: []
}>()

const formRef = useTemplateRef('formRef')
const toast = useToast()

const form = ref({
  date: '',
  status: VisitStatus.Pending as VisitStatus,
  customerPresence: '',
  nextAction: ''
})

const statusItems = computed(() =>
  Object.values(VisitStatus).map(value => ({
    label: formatLeadStatus(value),
    value
  }))
)

function resetForm() {
  form.value = {
    date: '',
    status: VisitStatus.Pending,
    customerPresence: '',
    nextAction: ''
  }
}

function populateFormFromVisit(visit: TVisit) {
  form.value = {
    date: toDatetimeLocalValue(visit.date),
    status: visit.status,
    customerPresence: visit.customerPresence ?? '',
    nextAction: visit.nextAction ?? ''
  }
}

watch(open, isOpen => {
  if (!isOpen) return
  if (props.visit) populateFormFromVisit(props.visit)
  else resetForm()
})

watch(
  () => props.visit,
  visit => {
    if (open.value && visit) populateFormFromVisit(visit)
  }
)

const { mutate, isPending } = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    $fetch('/api/visits', {
      method: 'POST',
      body
    })
})

const onSubmit = (event: FormSubmitEvent<typeof form.value>) => {
  const payload: Record<string, unknown> = {
    status: event.data.status,
    customerPresence: event.data.customerPresence?.trim() || undefined,
    nextAction: event.data.nextAction?.trim() || undefined
  }

  if (isEditMode.value && props.visit) payload.id = props.visit.id
  else payload.leadId = props.lead.id

  if (event.data.date) payload.date = event.data.date

  mutate(payload, {
    onSuccess() {
      toast.add({
        title: isEditMode.value ? 'Visit updated' : 'Visit scheduled',
        color: 'success'
      })
      open.value = false
      emit('success')
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'date', message }])
    }
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEditMode ? 'Edit visit' : 'Schedule visit'"
    :description="
      isEditMode ? 'Update this site visit record.' : 'Record a site visit for this lead.'
    "
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
          name="date"
          label="Visit date & time"
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
          name="customerPresence"
          label="Customer presence"
        >
          <UInput
            v-model="form.customerPresence"
            size="lg"
            class="w-full"
            placeholder="e.g. Present, Absent"
          />
        </UFormField>

        <UFormField
          name="nextAction"
          label="Next action"
        >
          <UTextarea
            v-model="form.nextAction"
            :rows="3"
            size="lg"
            class="w-full"
            placeholder="What should happen next?"
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
            :icon="isEditMode ? 'i-lucide-save' : 'i-lucide-map-pin'"
            :loading="isPending"
          >
            {{ isEditMode ? 'Update visit' : 'Schedule visit' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
