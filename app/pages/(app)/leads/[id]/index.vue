<script setup lang="ts">
definePageMeta({
  title: 'Lead'
})

const route = useRoute()
const $fetch = useRequestFetch()

const queryKey = computed(() => {
  return [`/api/leads/${route.params.id}`]
})

const { data, error } = useQuerySSR<TLead>({
  queryKey,
  queryFn: ({ queryKey: [url] }) => {
    return $fetch<TLead>(url as string)
  }
})
</script>

<template>
  <div>
    <h1>Lead {{ $route.params.id }}</h1>
    <pre>{{ data }}</pre>
    <pre>{{ error }}</pre>
  </div>
</template>
