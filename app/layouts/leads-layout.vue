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
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <div class="flex-1 flex flex-col relative overflow-hidden">
      <!-- Header -->
      <div class="p-4 sm:p-6 flex items-center justify-between flex-none">
        <div>
          <h1>Leads Layout</h1>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-plus"
            label="Add Lead"
            color="primary"
            to="/leads/new"
          />
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
        </div>
      </div>
      <!-- Content -->
      <slot />
    </div>
  </NuxtLayout>
</template>
