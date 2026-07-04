<script setup lang="ts">
import type { TPropertyFormState } from '@/utils/properties'
import {
  formatPropertyPrice,
  propertyToFormState,
  toPropertyPatchPayload
} from '@/utils/properties'

definePageMeta({ title: 'Property Details' })

const route = useRoute()
const toast = useToast()
const formRef = useTemplateRef('formRef')

const propertyId = computed(() => Number(route.params.id))

const { data, error, isFetching, refetch } = useQuerySSR<TProperty>({
  queryKey: ['property', propertyId],
  queryFn: () => $fetch<TProperty>(`/api/properties/${propertyId.value}`)
})

const form = ref<TPropertyFormState>(propertyToFormState())
const isSaving = ref(false)

const attachments = computed(() => data.value?.attachable?.attachments ?? [])

watch(
  data,
  property => {
    if (property) form.value = propertyToFormState(property)
  },
  { immediate: true }
)

async function onSave(state: TPropertyFormState) {
  const body = toPropertyPatchPayload(state)
  if (!Object.keys(body).length) {
    toast.add({ title: 'No changes to save', color: 'neutral' })
    return
  }

  isSaving.value = true
  try {
    const property = await $fetch<TProperty>(`/api/properties/${propertyId.value}`, {
      method: 'PATCH',
      body
    })
    form.value = propertyToFormState(property)
    toast.add({ title: 'Property updated', color: 'success' })
    await refetch()
  } catch (err) {
    const { message, errors } = parseError(err)
    if (errors?.length) formRef.value?.setErrors(errors)
    else {
      toast.add({
        title: 'Failed to update property',
        description: message,
        color: 'error'
      })
    }
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex-1 overflow-y-auto scrollbar">
    <div class="max-w-3xl mx-auto p-6 space-y-6">
      <template v-if="isFetching && !data">
        <USkeleton class="h-8 w-48" />
        <USkeleton class="h-64 w-full" />
      </template>

      <template v-else-if="error || !data">
        <UPageCard>
          <div class="text-center py-8 space-y-3">
            <UIcon
              name="i-lucide-search-x"
              class="size-8 text-muted mx-auto"
            />
            <h1 class="text-lg font-semibold">
              Property not found
            </h1>
            <p class="text-sm text-muted">
              This property does not exist or you do not have permission to view it.
            </p>
            <UButton
              label="Back to properties"
              color="neutral"
              variant="outline"
              to="/properties"
            />
          </div>
        </UPageCard>
      </template>

      <template v-else>
        <div class="flex items-start gap-3">
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/properties"
          />
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-semibold text-highlighted truncate">
                {{ data.name }}
              </h1>
              <UBadge
                :label="data.status"
                variant="soft"
              />
            </div>
            <p class="text-sm text-muted mt-1">
              {{ data.sid }} · {{ formatPropertyPrice(Number(data.price || 0)) }}
            </p>
          </div>
        </div>

        <UPageCard>
          <PropertyForm
            ref="formRef"
            v-model="form"
            upload-mode="upload"
            :property-id="data.id"
            :attachable-id="data.attachableId"
            :attachments="attachments"
            :disabled="isSaving"
            @submit="onSave"
            @refresh-attachments="refetch"
          >
            <template #actions>
              <UButton
                type="button"
                color="neutral"
                variant="subtle"
                to="/properties"
                :disabled="isSaving"
              >
                Back
              </UButton>
              <UButton
                type="submit"
                icon="i-lucide-save"
                :loading="isSaving"
              >
                Save changes
              </UButton>
            </template>
          </PropertyForm>
        </UPageCard>
      </template>
    </div>
  </div>
</template>
