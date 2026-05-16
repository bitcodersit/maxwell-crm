<script setup lang="ts">
import type { TLead, TLeadSource, TLeadStatus } from '~~/shared/types/Lead'
import {
  LEAD_SOURCES,
  LEAD_STATUSES,
  PROPERTY_TYPE_MAIN,
  PROPERTY_TYPE_SUB,
  SALESMEN
} from '@/composables/useLeadsStore'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  lead?: TLead | null
}>()

const emit = defineEmits<{
  saved: [lead: TLead]
}>()

const { upsert } = useLeadsStore()
const toast = useToast()
const saving = ref(false)

const form = reactive({
  source: 'Facebook' as TLeadSource,
  customerName: '',
  phone: '',
  area: '',
  propertyTypeMain: 'Land' as (typeof PROPERTY_TYPE_MAIN)[number],
  propertyTypeSub: 'Ready' as (typeof PROPERTY_TYPE_SUB)[number],
  block: '',
  road: '',
  budgetRange: '',
  status: 'Warm' as TLeadStatus,
  assignedSalesman: '',
  followUpDate: '',
  notes: ''
})

function resetForm(lead?: TLead | null) {
  form.source = lead?.source ?? 'Facebook'
  form.customerName = lead?.customerName ?? ''
  form.phone = lead?.phone ?? ''
  form.area = lead?.area ?? ''
  form.propertyTypeMain = lead?.propertyTypeMain ?? 'Land'
  form.propertyTypeSub = lead?.propertyTypeSub ?? 'Ready'
  form.block = lead?.block ?? ''
  form.road = lead?.road ?? ''
  form.budgetRange = lead?.budgetRange ?? ''
  form.status = lead?.status ?? 'Warm'
  form.assignedSalesman = lead?.assignedSalesman ?? ''
  form.followUpDate = lead?.followUpDate ?? ''
  form.notes = lead?.notes ?? ''
}

watch(
  () => [open.value, props.lead] as const,
  ([isOpen]) => {
    if (!isOpen) return
    resetForm(props.lead)
  }
)

const isEdit = computed(() => !!props.lead?.id)

async function onSubmit() {
  if (!form.customerName.trim() || !form.phone.trim()) {
    toast.add({
      color: 'error',
      title: 'Required fields',
      description: 'Customer name and phone are required.'
    })
    return
  }

  saving.value = true
  try {
    const saved = await upsert({
      id: props.lead?.id,
      ...form,
      area: form.area || null,
      block: form.block || null,
      road: form.road || null,
      budgetRange: form.budgetRange || null,
      assignedSalesman: form.assignedSalesman || null,
      followUpDate: form.followUpDate || null,
      notes: form.notes || null
    })
    toast.add({
      color: 'success',
      title: 'Success',
      description: isEdit.value ? 'Lead updated successfully' : 'Lead added successfully'
    })
    emit('saved', saved)
    open.value = false
  } catch (e: unknown) {
    const { message } = parseError(e)
    toast.add({ color: 'error', title: 'Error', description: message })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="isEdit ? `Edit ${lead?.serialCode}` : 'Add New Lead'"
    :description="isEdit ? 'Update lead information' : 'Create a new lead in the pipeline'"
    :ui="{ content: 'max-w-2xl w-full' }"
  >
    <template #body>
      <div class="min-h-0 max-h-[min(65vh,560px)] overflow-y-auto pr-1 -mr-1">
        <UForm :state="form" class="grid grid-cols-1 gap-4" @submit="onSubmit">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Lead Source" name="source">
              <USelect v-model="form.source" :items="[...LEAD_SOURCES]" class="w-full" />
            </UFormField>
            <UFormField label="Lead ID" name="serialCode">
              <UInput
                :model-value="lead?.serialCode ?? 'Auto-generated'"
                disabled
                class="w-full"
              />
            </UFormField>
            <UFormField label="Customer Name" name="customerName" required class="sm:col-span-2">
              <UInput v-model="form.customerName" placeholder="Full name" class="w-full" />
            </UFormField>
            <UFormField label="Phone Number" name="phone" required>
              <UInput v-model="form.phone" placeholder="01X-XXXXXXX" class="w-full" />
            </UFormField>
            <UFormField label="Area / Location" name="area">
              <UInput v-model="form.area" placeholder="e.g. Purbachal" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Property Type (Main)" name="propertyTypeMain">
              <USelect
                v-model="form.propertyTypeMain"
                :items="[...PROPERTY_TYPE_MAIN]"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Property Type (Sub)" name="propertyTypeSub">
              <USelect
                v-model="form.propertyTypeSub"
                :items="[...PROPERTY_TYPE_SUB]"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Block" name="block">
              <UInput v-model="form.block" class="w-full" />
            </UFormField>
            <UFormField label="Road" name="road">
              <UInput v-model="form.road" class="w-full" />
            </UFormField>
            <UFormField label="Budget Range" name="budgetRange" class="sm:col-span-2">
              <UInput v-model="form.budgetRange" placeholder="e.g. 50-70 Lac" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <UFormField label="Status" name="status">
              <USelect v-model="form.status" :items="[...LEAD_STATUSES]" class="w-full" />
            </UFormField>
            <UFormField label="Follow-up Date" name="followUpDate">
              <UInput v-model="form.followUpDate" type="date" class="w-full" />
            </UFormField>
            <UFormField label="Assigned Salesman" name="assignedSalesman" class="sm:col-span-2">
              <USelect v-model="form.assignedSalesman" :items="[...SALESMEN]" class="w-full" />
            </UFormField>
            <UFormField label="Conversation Notes" name="notes" class="sm:col-span-2">
              <UTextarea
                v-model="form.notes"
                :rows="3"
                placeholder="Add notes about this lead…"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-default">
            <UButton
              type="button"
              color="neutral"
              variant="outline"
              label="Cancel"
              @click="open = false"
            />
            <UButton
              type="submit"
              :label="isEdit ? 'Save Changes' : 'Add Lead'"
              icon="i-lucide-check"
              :loading="saving"
            />
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
