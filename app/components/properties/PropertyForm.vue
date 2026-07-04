<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { TPropertyFormState } from '@/utils/properties'

const props = withDefaults(
  defineProps<{
    disabled?: boolean
    showUpload?: boolean
    uploadMode?: 'pending' | 'upload'
    propertyId?: number
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
  submit: [state: TPropertyFormState]
  refreshAttachments: []
}>()

const form = defineModel<TPropertyFormState>({ required: true })
const pendingFiles = defineModel<File[]>('pendingFiles', { default: () => [] })

const formRef = useTemplateRef('formRef')

defineExpose({
  setErrors: (errors: Parameters<NonNullable<typeof formRef.value>['setErrors']>[0]) => {
    formRef.value?.setErrors(errors)
  }
})

function onSubmit(event: FormSubmitEvent<TPropertyFormState>) {
  emit('submit', event.data)
}
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
      name="name"
      label="Property Title"
      class="col-span-full"
    >
      <UInput
        v-model="form.name"
        size="lg"
        class="w-full"
        placeholder="e.g. Block A Plot 12"
      />
    </UFormField>

    <UFormField
      name="status"
      label="Status"
      class="col-span-12 sm:col-span-6"
    >
      <USelect
        v-model="form.status"
        :items="['Available', 'Hold', 'Sold']"
        size="lg"
        class="w-full"
        placeholder="Select status"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Address" />
    </div>

    <UFormField
      name="addressLine1"
      label="Location"
      class="col-span-full"
    >
      <UInput
        v-model="form.addressLine1"
        size="lg"
        class="w-full"
        placeholder="e.g. Purbachal"
      />
    </UFormField>

    <UFormField
      name="road"
      label="Road"
      class="col-span-12 sm:col-span-4"
    >
      <UInput
        v-model="form.road"
        size="lg"
        class="w-full"
        placeholder="Road no"
      />
    </UFormField>

    <UFormField
      name="block"
      label="Block"
      class="col-span-12 sm:col-span-4"
    >
      <UInput
        v-model="form.block"
        size="lg"
        class="w-full"
        placeholder="Block"
      />
    </UFormField>

    <UFormField
      name="facing"
      label="Facing"
      class="col-span-12 sm:col-span-4"
    >
      <UInput
        v-model="form.facing"
        size="lg"
        class="w-full"
        placeholder="e.g. East"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Size" />
    </div>

    <UFormField
      name="katha"
      label="Katha"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.katha"
        type="number"
        min="0"
        size="lg"
        class="w-full"
        placeholder="Size..."
      />
    </UFormField>

    <UFormField
      name="sqft"
      label="Sqft"
      class="col-span-12 sm:col-span-6"
    >
      <UInput
        v-model="form.sqft"
        type="number"
        min="0"
        size="lg"
        class="w-full"
        placeholder="Size..."
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Pricing" />
    </div>

    <UFormField
      name="price"
      label="Price (BDT)"
      class="col-span-12 sm:col-span-4"
    >
      <UInput
        v-model="form.price"
        type="number"
        min="0"
        size="lg"
        class="w-full"
        placeholder="Price..."
      />
    </UFormField>

    <UFormField
      name="previousPrice"
      label="Previous Price (BDT)"
      class="col-span-12 sm:col-span-4"
    >
      <UInput
        v-model="form.previousPrice"
        type="number"
        min="0"
        size="lg"
        class="w-full"
        placeholder="Price..."
      />
    </UFormField>

    <UFormField
      name="purchaseType"
      label="Purchase Type"
      class="col-span-12 sm:col-span-4"
    >
      <FormSelectMenu
        v-model="form.purchaseType"
        api="/api/options"
        :query="{ type: 'PROPERTY_PURCHASE_TYPE' }"
        size="lg"
        class="w-full"
        clear
        placeholder="Select purchase type"
      />
    </UFormField>

    <div class="col-span-full">
      <USeparator label="Assignment" />
    </div>

    <UFormField
      name="assignedUsers"
      label="Sales Manager"
      class="col-span-full"
    >
      <FormAutocomplete
        v-model="form.assignedUsers"
        api="/api/users"
        :query="{ options: true, roleNames: 'Salesman' }"
        size="lg"
        class="w-full"
        placeholder="Assign sales manager"
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
          :model-id="propertyId"
          :attachable-id="attachableId"
          attachable-model-type="property"
          folder="properties"
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
