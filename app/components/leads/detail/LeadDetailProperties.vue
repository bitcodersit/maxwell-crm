<script setup lang="ts">
import type { TLead } from '~~/shared/types/Lead'
import type { TProperty } from '~~/shared/types/Property'
import { formatPropertyPrice } from '@/utils/properties'

const props = defineProps<{
  lead: TLead
  properties: TPaginated<TProperty>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const toast = useToast()
const { confirm } = useConfirm()
const { user } = useCurrentUser()

const selected = ref<TProperty | null>(null)
const isLinking = ref(false)
const unlinkingId = ref<number | null>(null)
const editModalOpen = ref(false)
const editingPropertyId = ref<number | null>(null)

const canUpdateProperty = computed(
  () =>
    !!(
      user.value?.updateAnyProperties
      || user.value?.updateOwnProperties
      || user.value?.isSuperAdmin
    )
)

function openEditProperty(property: TProperty) {
  editingPropertyId.value = property.id
  editModalOpen.value = true
}

watch(editModalOpen, open => {
  if (!open) editingPropertyId.value = null
})

const linkedIds = computed(() => new Set(props.properties.data.map(property => property.id)))

const selectedSummary = computed(() => {
  const property = selected.value
  if (!property) return null
  const price =
    property.price != null ? ` · ${formatPropertyPrice(Number(property.price))}` : ''
  return `${property.sid} — ${property.name}${price}`
})

async function savePropertyIds(propertyIds: number[], successMessage: string) {
  await $fetch(`/api/leads/${props.lead.id}`, {
    method: 'PATCH',
    body: { propertyIds }
  })
  toast.add({ title: successMessage, color: 'success' })
  emit('refresh')
}

async function onLinkProperty() {
  const property = selected.value
  if (!property?.id) {
    toast.add({
      title: 'Select a property',
      description: 'Search and choose a property before linking.',
      color: 'warning'
    })
    return
  }

  if (linkedIds.value.has(property.id)) {
    toast.add({
      title: 'Already linked',
      description: 'This property is already linked to the lead.',
      color: 'neutral'
    })
    return
  }

  isLinking.value = true
  try {
    await savePropertyIds([...linkedIds.value, property.id], 'Property linked to lead')
    selected.value = null
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      title: 'Failed to link property',
      description: message,
      color: 'error'
    })
  } finally {
    isLinking.value = false
  }
}

async function onUnlinkProperty(property: TProperty) {
  if (!(await confirm(`Unlink “${property.name}” from this lead?`))) return

  unlinkingId.value = property.id
  try {
    await savePropertyIds(
      [...linkedIds.value].filter(id => id !== property.id),
      'Property unlinked'
    )
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      title: 'Failed to unlink property',
      description: message,
      color: 'error'
    })
  } finally {
    unlinkingId.value = null
  }
}
</script>

<template>
  <div class="pt-6 space-y-6">
    <UPageCard
      title="Attach property"
      description="Search inventory and attach a property to this lead."
      variant="subtle"
    >
      <div class="space-y-2">
        <div class="flex flex-col sm:flex-row gap-3 sm:items-end">
          <UFormField
            label="Property"
            class="flex-1 min-w-0"
            hint="Search by property ID, name, area, or facing"
          >
            <FormSelectMenu
              v-model="selected"
              api="/api/properties"
              label-key="name"
              placeholder="Search properties to link…"
              size="lg"
              class="w-full"
              clear
              :disabled="isLinking"
            />
          </UFormField>
          <UButton
            icon="i-lucide-link-2"
            label="Attach to lead"
            size="lg"
            class="shrink-0"
            :loading="isLinking"
            :disabled="!selected"
            @click="onLinkProperty"
          />
        </div>
        <p
          v-if="selectedSummary"
          class="text-xs text-muted"
        >
          {{ selectedSummary }}
        </p>
      </div>
    </UPageCard>

    <div
      v-if="properties.data.length"
      class="space-y-3"
    >
      <h3 class="text-sm font-medium text-highlighted">
        Linked properties
        <span class="text-muted font-normal">({{ properties.total }})</span>
      </h3>

      <div class="grid gap-3 sm:grid-cols-2">
        <UPageCard
          v-for="property in properties.data"
          :key="property.id"
          variant="subtle"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-2">
                <NuxtLink
                  :to="`/properties/${property.id}`"
                  class="font-semibold text-highlighted hover:text-primary transition-colors truncate"
                >
                  {{ property.name }}
                </NuxtLink>
                <UBadge
                  :label="property.status"
                  color="neutral"
                  variant="subtle"
                  size="xs"
                />
              </div>
              <p class="text-xs font-mono text-muted">
                {{ property.sid }}
              </p>
              <p class="text-sm text-muted">
                {{
                  property.price != null
                    ? formatPropertyPrice(Number(property.price))
                    : 'No price'
                }}
                <template v-if="property.purchaseType?.name">
                  · {{ property.purchaseType.name }}
                </template>
              </p>
              <p
                v-if="property.address?.name || property.address?.addressLine1"
                class="text-xs text-muted flex items-center gap-1"
              >
                <UIcon
                  name="i-lucide-map-pin"
                  class="size-3 shrink-0"
                />
                <span class="truncate">
                  {{ property.address?.name || property.address?.addressLine1 }}
                </span>
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UButton
                v-if="canUpdateProperty"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                :disabled="isLinking"
                @click="openEditProperty(property)"
              />
              <UButton
                icon="i-lucide-unlink"
                color="error"
                variant="ghost"
                size="sm"
                :loading="unlinkingId === property.id"
                :disabled="isLinking"
                @click="onUnlinkProperty(property)"
              />
            </div>
          </div>
        </UPageCard>
      </div>
    </div>

    <LeadDetailEmptyState
      v-else
      icon="i-lucide-building-2"
      title="No properties linked"
      description="Search for a property above and click Attach to lead to attach it to this lead."
    />

    <PropertyEditFormModal
      v-model:open="editModalOpen"
      :property-id="editingPropertyId"
      @success="emit('refresh')"
    />
  </div>
</template>
