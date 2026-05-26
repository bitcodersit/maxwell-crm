<script setup lang="ts">
const route = useRoute()

const views = [
  {
    name: 'kanban',
    path: '/leads',
    icon: 'i-lucide-kanban'
  },
  {
    name: 'table',
    path: '/leads/table',
    icon: 'i-lucide-table'
  }
]

const leadFormOpen = ref(false)
const leadFormModel = ref<Partial<TLead>>({})

const onAddLead = (v?: Partial<TLead>) => {
  leadFormModel.value = {
    id: v?.id,
    status: v?.status ?? LeadStatus.New
  }
  leadFormOpen.value = true
}
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <LeadFormModal
      v-model="leadFormModel"
      v-model:open="leadFormOpen"
    />
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Header -->
      <div class="p-4 sm:p-6 flex items-center justify-between flex-none">
        <div>
          <h1>Leads Layout</h1>
        </div>
        <div class="flex items-center gap-2">
          <UFieldGroup orientation="horizontal">
            <UButton
              v-for="view in views"
              :key="view.name"
              :to="view.path"
              :icon="view.icon"
              :color="route.path === view.path ? 'primary' : 'neutral'"
              variant="subtle"
            />
          </UFieldGroup>
          <UButton
            icon="i-lucide-plus"
            @click="onAddLead()"
          >
            Add Lead
          </UButton>
        </div>
      </div>
      <!-- Content -->
      <slot />
    </div>
  </NuxtLayout>
</template>
