<script setup lang="ts">
import type { TBaseFormField } from '../base/BaseForm.vue'

const open = defineModel<boolean>('open', { default: false })
const model = defineModel<Partial<TLead>>({ default: () => ({}) })

const statuses = useLeadStatusItems()
const fields = computed<TBaseFormField[]>(() => [
  {
    type: 'select',
    name: 'status',
    label: 'Status',
    props: {
      items: statuses.value
    }
  }
])

const client = useQueryClient()
const onSuccess = (lead: TLead) => {
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
}
</script>

<template>
  <BaseFormModal
    v-model="model"
    v-model:open="open"
    :api="'/api/leads'"
    :fields="fields"
    :title="model.id ? 'Edit Lead' : 'Add Lead'"
    :description="model.id ? 'Edit lead information' : 'Create a new lead in the pipeline'"
    :ui="{ content: 'max-w-2xl w-full' }"
    @success="onSuccess"
  />
</template>
