<script setup lang="ts">
definePageMeta({
  title: 'Lead'
})

const route = useRoute()

const leadId = computed(() => String(route.params.id))

const { data, error, isLoading, refresh } = useLeadDetailData(leadId)

const selectedTab = ref('overview')

const followUpModalOpen = ref(false)
const editingFollowUp = ref<TFollowUp | null>(null)

const visitModalOpen = ref(false)
const editingVisit = ref<TVisit | null>(null)

const editModalOpen = ref(false)

function handleRefresh() {
  return refresh()
}

watch(followUpModalOpen, open => {
  if (!open) editingFollowUp.value = null
})

watch(visitModalOpen, open => {
  if (!open) editingVisit.value = null
})

provideLeadDetailActions({
  refresh: handleRefresh,

  openFollowUpModal: () => {
    selectedTab.value = 'follow-ups'

    editingFollowUp.value = null

    followUpModalOpen.value = true
  },

  openEditFollowUpModal: (followUp: TFollowUp) => {
    selectedTab.value = 'follow-ups'

    editingFollowUp.value = followUp

    followUpModalOpen.value = true
  },

  openVisitModal: () => {
    selectedTab.value = 'visits'

    editingVisit.value = null

    visitModalOpen.value = true
  },

  openEditVisitModal: (visit: TVisit) => {
    selectedTab.value = 'visits'

    editingVisit.value = visit

    visitModalOpen.value = true
  },

  openEditModal: () => {
    editModalOpen.value = true
  },

  setTab: tab => {
    selectedTab.value = tab
  }
})
</script>

<template>
  <div class="flex-1 overflow-y-auto scrollbar">
    <div class="max-w-7xl mx-auto p-6">
      <template v-if="isLoading">
        <div class="space-y-4">
          <USkeleton class="h-8 w-32" />

          <USkeleton class="h-10 w-64" />

          <USkeleton class="h-5 w-96" />

          <div class="flex gap-2 pt-4">
            <USkeleton
              v-for="i in 6"
              :key="i"
              class="h-9 w-24 rounded-full"
            />
          </div>

          <USkeleton class="h-64 w-full mt-6" />
        </div>
      </template>

      <template v-else-if="error || !data">
        <LeadDetailEmptyState
          icon="i-lucide-search-x"
          title="Lead not found"
          description="This lead does not exist or you do not have permission to view it."
        >
          <UButton
            class="mt-4"
            label="Back to leads"
            color="neutral"
            variant="outline"
            to="/leads"
          />
        </LeadDetailEmptyState>
      </template>

      <template v-else>
        <LeadDetailHeader :lead="data.lead" />

        <LeadDetailTabs
          v-model:tab="selectedTab"
          :data="data"
          @refresh="handleRefresh"
        />

        <LeadFollowUpFormModal
          v-model:open="followUpModalOpen"
          :lead="data.lead"
          :follow-up="editingFollowUp"
          @success="handleRefresh"
        />

        <LeadVisitFormModal
          v-model:open="visitModalOpen"
          :lead="data.lead"
          :visit="editingVisit"
          @success="handleRefresh"
        />

        <LeadEditFormModal
          v-model:open="editModalOpen"
          :lead="data.lead"
          :attachments="data.attachments"
          @success="handleRefresh"
          @refresh-attachments="handleRefresh"
        />
      </template>
    </div>
  </div>
</template>
