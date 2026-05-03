<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const links: NavigationMenuItem[][] = [
  [
    {
      label: 'General',
      icon: 'i-lucide-user',
      to: '/settings',
      exact: true,
    },

    {
      label: 'Security',
      icon: 'i-lucide-shield',
      to: '/settings/security',
    },
  ],
]
</script>

<template>
  <UDashboardToolbar>
    <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
  </UDashboardToolbar>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
    <NuxtPage />
  </div>
</template>
