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
          <h1>Leads</h1>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-plus"
            label="Add Lead"
            color="primary"
            to="/leads/new"
          />
        </div>
      </div>
      <!-- Content -->
      <slot />
    </div>
  </NuxtLayout>
</template>
