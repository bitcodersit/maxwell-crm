<script setup lang="ts">
const props = defineProps<{
  followUps: TPaginated<TFollowUp>
}>()

const emit = defineEmits<{
  refresh: []
}>()

const actions = useLeadDetailActions()
const toast = useToast()
const { confirm } = useConfirm()
const { user } = useCurrentUser()

const items = computed(() => props.followUps.data)
const deletingId = ref<number | null>(null)

function canEdit(_item: TFollowUp) {
  return canEditLeadDetailRecord(user.value)
}

function canDelete(item: TFollowUp) {
  return canDeleteLeadDetailRecord(user.value, item.authorId, user.value?.deleteAnyFollowUps)
}

async function onDelete(item: TFollowUp) {
  if (!(await confirm('Delete this follow-up?'))) return

  deletingId.value = item.id
  try {
    await $fetch(`/api/followups/${item.id}`, { method: 'DELETE' })
    toast.add({ title: 'Follow-up deleted', color: 'success' })
    emit('refresh')
  } catch (error) {
    const { message } = parseError(error)
    toast.add({
      title: 'Failed to delete follow-up',
      description: message,
      color: 'error'
    })
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <div class="pt-6 space-y-4">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <p class="text-sm text-muted">
        {{ followUps.total }} follow-up{{ followUps.total === 1 ? '' : 's' }} recorded
      </p>
      <UButton
        icon="i-lucide-plus"
        label="Add follow-up"
        size="sm"
        @click="actions?.openFollowUpModal()"
      />
    </div>

    <LeadDetailEmptyState
      v-if="!items.length"
      icon="i-lucide-phone-forwarded"
      title="No follow-ups yet"
      description="Schedule calls, visits, or messages to track engagement with this lead."
    >
      <UButton
        class="mt-4"
        icon="i-lucide-plus"
        label="Add follow-up"
        size="sm"
        @click="actions?.openFollowUpModal()"
      />
    </LeadDetailEmptyState>

    <div
      v-else
      class="relative space-y-0"
    >
      <div
        class="absolute left-[19px] top-3 bottom-3 w-px bg-default"
        aria-hidden="true"
      />
      <div
        v-for="item in items"
        :key="item.id"
        class="relative flex gap-4 pb-6 last:pb-0"
      >
        <div
          class="relative z-10 flex items-center justify-center size-10 rounded-full bg-elevated border border-default shrink-0"
        >
          <UIcon
            :name="followUpTypeIcons[item.type] || 'i-lucide-circle'"
            class="size-4 text-muted"
          />
        </div>
        <UPageCard
          variant="subtle"
          class="flex-1 min-w-0"
        >
          <div class="flex flex-wrap items-start justify-between gap-2">
            <div>
              <div class="flex flex-wrap items-center gap-2">
                <span class="font-medium text-highlighted">{{ item.type }}</span>
                <UBadge
                  :label="formatLeadStatus(item.status)"
                  :color="followUpStatusColors[item.status] || 'neutral'"
                  variant="soft"
                  size="sm"
                />
              </div>
              <p class="text-sm text-muted mt-1">
                {{ $dfc(item.date) }}
                <span v-if="item.author?.name"> · {{ item.author.name }}</span>
              </p>
            </div>
            <div class="flex items-center gap-1 shrink-0">
              <UBadge
                v-if="item.attachable?.attachments?.length"
                :label="`${item.attachable.attachments.length} file${item.attachable.attachments.length === 1 ? '' : 's'}`"
                color="neutral"
                variant="subtle"
                size="sm"
                icon="i-lucide-paperclip"
              />
              <UButton
                v-if="canEdit(item)"
                icon="i-lucide-pencil"
                color="neutral"
                variant="ghost"
                size="sm"
                @click="actions?.openEditFollowUpModal(item)"
              />
              <UButton
                v-if="canDelete(item)"
                icon="i-lucide-trash-2"
                color="error"
                variant="ghost"
                size="sm"
                :loading="deletingId === item.id"
                @click="onDelete(item)"
              />
            </div>
          </div>
          <p
            v-if="item.outcome"
            class="mt-3 text-sm text-default"
          >
            {{ item.outcome }}
          </p>
          <p
            v-if="item.nextDate"
            class="mt-2 text-xs text-muted inline-flex items-center gap-1"
          >
            <UIcon
              name="i-lucide-calendar"
              class="size-3.5"
            />
            Next: {{ $dfc(item.nextDate, 'MMM d, yyyy h:mm a') }}
          </p>
        </UPageCard>
      </div>
    </div>
  </div>
</template>
