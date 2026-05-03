<script setup lang="ts">
const appTitle = ['Maxwell Group CRM']
useHead({
  titleTemplate(v) {
    return [v, ...appTitle].filter(Boolean).join(' - ')
  },
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
