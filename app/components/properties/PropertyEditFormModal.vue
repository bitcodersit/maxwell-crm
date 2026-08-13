<script setup lang="ts">
import type { TPropertyFormState } from '@/utils/properties'
import { propertyToFormState, toPropertyPatchPayload } from '@/utils/properties'

const open = defineModel<boolean>('open', { default: false })

const props = defineProps<{
  propertyId: number | null
}>()

const emit = defineEmits<{
  success: []
}>()

const formRef = useTemplateRef('formRef')
const toast = useToast()

const form = ref<TPropertyFormState>(propertyToFormState())
const pendingFiles = ref<File[]>([])

const { data: property, isFetching, refetch } = useQuery({
  queryKey: computed(() => ['property-edit', props.propertyId]),
  queryFn: () => $fetch<TProperty>(`/api/properties/${props.propertyId}`),
  enabled: computed(() => open.value && !!props.propertyId)
})

watch(property, value => {
  if (value) form.value = propertyToFormState(value)
})

const { mutate, isPending } = useMutation({
  mutationFn: (body: Record<string, unknown>) =>
    $fetch<TProperty>(`/api/properties/${props.propertyId}`, {
      method: 'PATCH',
      body
    })
})

function onSubmit(state: TPropertyFormState = form.value) {
  const body = toPropertyPatchPayload(state)
  if (!Object.keys(body).length) {
    toast.add({ title: 'No changes to save', color: 'neutral' })
    open.value = false
    return
  }

  mutate(body, {
    onSuccess(updated) {
      form.value = propertyToFormState(updated)
      toast.add({ title: 'Property updated', color: 'success' })
      open.value = false
      emit('success')
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else {
        toast.add({
          title: 'Failed to update property',
          description: message,
          color: 'error'
        })
      }
    }
  })
}

function onRefreshAttachments() {
  void refetch()
  emit('success')
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Edit property"
    :description="property ? `${property.sid} · ${property.name}` : 'Update property details.'"
    :ui="{ content: 'max-w-3xl w-full' }"
  >
    <template #body>
      <div
        v-if="isFetching && !property"
        class="space-y-4"
      >
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-10 w-full" />
        <USkeleton class="h-32 w-full" />
      </div>

      <PropertyForm
        v-else-if="property"
        ref="formRef"
        v-model="form"
        v-model:pending-files="pendingFiles"
        upload-mode="upload"
        :property-id="property.id"
        :attachable-id="property.attachableId"
        :attachments="property.attachable?.attachments ?? []"
        :disabled="isPending"
        @submit="onSubmit"
        @refresh-attachments="onRefreshAttachments"
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
      </PropertyForm>
    </template>
  </UModal>
</template>
