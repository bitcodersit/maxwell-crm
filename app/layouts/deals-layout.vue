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
          <h1>Deals</h1>
        </div>
      </div>
      <!-- Content -->
      <slot />
    </div>
  </NuxtLayout>
</template>
