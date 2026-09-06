<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lead: TLead | null
}>()

const emit = defineEmits<{
  success: [lead: TLead]
}>()

const step = ref<'confirm' | 'success'>('confirm')
const formRef = useTemplateRef('formRef')
const client = useQueryClient()

const boardQuery = {
  isDefault: true,
  module: BoardModule.LEADS
}

const { data: board, isFetching: isBoardFetching } = useQuery({
  queryKey: ['/api/boards/find', boardQuery] as const,
  queryFn: ({ queryKey: [api, query] }) => $fetch<TBoard>(api, { query }),
  enabled: computed(() => open.value)
})

const columnItems = computed(() =>
  (board.value?.columns ?? []).map(column => ({
    label: column.name,
    value: column.id
  }))
)

const form = ref<{ columnId?: number }>({
  columnId: undefined
})

function resetForm() {
  step.value = 'confirm'
  form.value = {
    columnId: board.value?.columns?.[0]?.id
  }
}

watch(open, isOpen => {
  if (isOpen) resetForm()
})

watch(
  () => board.value?.columns,
  columns => {
    if (!open.value || step.value !== 'confirm') return
    if (form.value.columnId == null && columns?.[0]) {
      form.value.columnId = columns[0].id
    }
  }
)

const { mutate, isPending } = useMutation({
  mutationFn: (body: { leadId: number; columnId: number }) =>
    $fetch<TLead>('/api/leads/convert', {
      method: 'PUT',
      body
    })
})

const onSubmit = (event: FormSubmitEvent<typeof form.value>) => {
  if (!props.lead || event.data.columnId == null) return
  mutate(
    {
      leadId: props.lead.id,
      columnId: event.data.columnId
    },
    {
      onSuccess(lead) {
        client.invalidateQueries({ queryKey: ['/api/leads'] })
        client.invalidateQueries({ queryKey: ['/api/boards/find'] })
        if (lead.boardItems?.[0]) {
          client.invalidateQueries({
            queryKey: [
              '/api/board-items',
              {
                columnId: lead.boardItems[0].columnId
              }
            ]
          })
        }
        step.value = 'success'
        emit('success', lead)
      },
      onError(error) {
        const { message, errors, description } = parseError(error)
        const fieldMessage =
          errors?.find(e => e.name === 'columnId')?.message ||
          errors?.map(e => e.message).filter(Boolean).join(', ') ||
          description ||
          message
        formRef.value?.setErrors([{ name: 'columnId', message: fieldMessage }])
      }
    }
  )
}

const close = () => {
  open.value = false
}

const goToDeals = () => {
  open.value = false
  navigateTo('/deals')
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="step === 'success' ? 'Lead converted' : 'Convert to Deal'"
    :description="
      step === 'success'
        ? `${lead?.sid || 'This lead'} is now on the deals board.`
        : `Confirm convert ${lead?.sid || 'this lead'} to a deal.`
    "
    :ui="{ content: 'max-w-md w-full', footer: 'justify-end' }"
  >
    <template
      v-if="step === 'confirm'"
      #body
    >
      <UForm
        ref="formRef"
        :state="form"
        :disabled="isPending"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          name="columnId"
          label="Column"
          hint="Choose a column on the default deals board."
          required
        >
          <USelect
            v-model="form.columnId"
            :items="columnItems"
            :loading="isBoardFetching"
            :disabled="isBoardFetching || !columnItems.length"
            placeholder="Select column"
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
            @click="close"
          >
            Cancel
          </UButton>
          <UButton
            type="submit"
            icon="i-lucide-repeat-2"
            :loading="isPending"
            :disabled="form.columnId == null || !columnItems.length"
          >
            Convert to Deal
          </UButton>
        </div>
      </UForm>
    </template>

    <template
      v-else
      #footer
    >
      <UButton
        color="neutral"
        variant="subtle"
        @click="close"
      >
        Close
      </UButton>
      <UButton
        icon="i-lucide-kanban"
        @click="goToDeals"
      >
        Go to Deals
      </UButton>
    </template>
  </UModal>
</template>
