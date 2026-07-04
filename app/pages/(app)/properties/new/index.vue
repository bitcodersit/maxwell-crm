<script setup lang="ts">
import type { TPropertyFormState } from '@/utils/properties'
import {
  createEmptyPropertyFormState,
  toPropertyPostPayload
} from '@/utils/properties'

definePageMeta({ title: 'Add Property' })

const router = useRouter()
const toast = useToast()
const formRef = useTemplateRef('formRef')

const form = ref<TPropertyFormState>(createEmptyPropertyFormState())
const pendingFiles = ref<File[]>([])
const isSubmitting = ref(false)

const { mutateAsync: uploadAttachments } = useAttachmentsMutation()

async function onSubmit(state: TPropertyFormState) {
  isSubmitting.value = true
  try {
    const property = await $fetch<TProperty>('/api/properties', {
      method: 'POST',
      body: toPropertyPostPayload(state)
    })

    if (pendingFiles.value.length) {
      await uploadAttachments({
        files: pendingFiles.value,
        folder: 'properties',
        attachableId: property.attachableId ?? undefined,
        attachableModelId: property.id,
        attachableModelType: 'property'
      })
    }

    toast.add({
      title: 'Property created',
      color: 'success'
    })
    await router.push(`/properties/${property.id}`)
  } catch (error) {
    const { message, errors } = parseError(error)
    if (errors?.length) formRef.value?.setErrors(errors)
    else {
      toast.add({
        title: 'Failed to create property',
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
          to="/properties"
        />
        <div>
          <h1 class="text-2xl font-semibold text-highlighted">
            Add New Property
          </h1>
          <p class="text-sm text-muted mt-1">
            Create a property, assign a sales manager, and queue documents to upload on save.
          </p>
        </div>
      </div>

      <UPageCard>
        <PropertyForm
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
              to="/properties"
              :disabled="isSubmitting"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="isSubmitting"
            >
              Create property
            </UButton>
          </template>
        </PropertyForm>
      </UPageCard>
    </div>
  </div>
</template>
