<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TLeadFormCustomer, TLeadFormState } from '@/utils/leads-form'
import { applyCustomerToFormState } from '@/utils/leads-form'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    showUpload?: boolean
    uploadMode?: 'pending' | 'upload'
    leadId?: number
    attachableId?: TMaybe<number>
    attachments?: TAttachment[]
  }>(),
  {
    showUpload: true,
    uploadMode: 'pending',
    attachments: () => []
  }
)

const emit = defineEmits<{
  submit: [state: TLeadFormState]
  refreshAttachments: []
}>()

const form = defineModel<TLeadFormState>({ required: true })
const pendingFiles = defineModel<File[]>('pendingFiles', { default: () => [] })

const formRef = useTemplateRef('formRef')
const statuses = useLeadStatusItems()

defineExpose({
  setErrors: (errors: Parameters<NonNullable<typeof formRef.value>['setErrors']>[0]) => {
    formRef.value?.setErrors(errors)
  }
})

function onSubmit(event: FormSubmitEvent<TLeadFormState>) {
  emit('submit', event.data)
}

function onCustomerChange(customer: TLeadFormCustomer | null | undefined) {
  applyCustomerToFormState(form.value, customer ?? null)
}

watch(
  () => form.value.customer,
  customer => {
    const phone = customer?.phone ?? ''
    const email = customer?.email ?? ''
    if (form.value.customerPhone !== phone) form.value.customerPhone = phone
    if (form.value.customerEmail !== email) form.value.customerEmail = email
  }
)
</script>

<template>
  <UForm
    ref="formRef"
    :state="form"
    :disabled="disabled"
    class="grid grid-cols-12 gap-4"
    @submit="onSubmit"
  >
    <UFormField
      name="status"
      label="Status"
      class="col-span-12 sm:col-span-6"
    >
      <USelect
        v-model="form.status"
        :items="statuses"
        size="lg"
        class="w-full"
        placeholder="Select status"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Customer" />
    </div>

    <UFormField
      name="customer"
      label="Customer"
      class="col-span-full"
    >
      <FormSelectMenu
        v-model="form.customer"
        api="/api/customers"
        label-key="name"
        placeholder="Search and select a customer…"
        size="lg"
        class="w-full"
        clear
        :disabled="disabled"
        @update:model-value="onCustomerChange"
      />
    </UFormField>

    <UFormField
      name="customerPhone"
      label="Phone"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.customerPhone"
        size="lg"
        class="w-full"
        placeholder="Auto-filled from customer"
        readonly
      />
    </UFormField>

    <UFormField
      name="customerEmail"
      label="Email"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.customerEmail"
        type="email"
        size="lg"
        class="w-full"
        placeholder="Auto-filled from customer"
        readonly
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Lead details" />
    </div>

    <UFormField
      name="source"
      label="Source"
      class="col-span-12 sm:col-span-6"
    >
      <FormSelectMenu
        v-model="form.source"
        api="/api/options"
        :query="{ type: 'SOURCE' }"
        size="lg"
        class="w-full"
        placeholder="Facebook, Website…"
        clear
      />
    </UFormField>

    <UFormField
      name="propertyTypeMain"
      label="Property type (main)"
      class="col-span-12 sm:col-span-6"
    >
      <FormSelectMenu
        v-model="form.propertyTypeMain"
        api="/api/options"
        :query="{ type: 'PROPERTY_TYPE_MAIN' }"
        size="lg"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      name="propertyTypeSub"
      label="Property type (sub)"
      class="col-span-12 sm:col-span-6"
    >
      <FormSelectMenu
        v-model="form.propertyTypeSub"
        api="/api/options"
        :query="{ type: 'PROPERTY_TYPE_SUB' }"
        size="lg"
        class="w-full"
        clear
      />
    </UFormField>

    <UFormField
      name="budgetMin"
      label="Budget min"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.budgetMin"
        type="number"
        min="0"
        step="0.01"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="budgetMax"
      label="Budget max"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.budgetMax"
        type="number"
        min="0"
        step="0.01"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Location" />
    </div>

    <UFormField
      name="area"
      label="Area"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.area"
        size="lg"
        class="w-full"
        placeholder="e.g. Gulshan"
      />
    </UFormField>

    <UFormField
      name="block"
      label="Block"
      class="col-span-12 sm:col-span-3"
    >
      <UInput
        v-model="form.block"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="road"
      label="Road"
      class="col-span-12 sm:col-span-3"
    >
      <UInput
        v-model="form.road"
        size="lg"
        class="w-full"
      />
    </UFormField>

    <UFormField
      name="addressLine1"
      label="Address"
      class="col-span-full"
    >
      <UInput
        v-model="form.addressLine1"
        size="lg"
        class="w-full"
        placeholder="Street or full address"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Assignment" />
    </div>

    <UFormField
      name="assignedUsers"
      label="Assign users"
      class="col-span-full"
    >
      <FormAutocomplete
        v-model="form.assignedUsers"
        api="/api/users"
        :query="{ options: true, roleNames: 'Salesman' }"
        size="lg"
        class="w-full"
        placeholder="Assign users"
      />
    </UFormField>

    <UFormField
      name="assignedTeams"
      label="Assign teams"
      class="col-span-full"
    >
      <FormAutocomplete
        v-model="form.assignedTeams"
        api="/api/teams"
        :query="{ options: true }"
        size="lg"
        class="w-full"
        placeholder="Assign teams"
      />
    </UFormField>

    <template v-if="showUpload">
      <div class="col-span-full">
        <USeparator label="Documents" />
      </div>
      <div class="col-span-full">
        <FormFileUpload
          v-model:pending-files="pendingFiles"
          :mode="uploadMode"
          :model-id="leadId"
          :attachable-id="attachableId"
          attachable-model-type="lead"
          folder="leads"
          :attachments="attachments"
          :disabled="disabled"
          @refresh="emit('refreshAttachments')"
        />
      </div>
    </template>

    <div class="col-span-full flex justify-end gap-2 pt-2">
      <slot name="actions" />
    </div>
  </UForm>
</template>
