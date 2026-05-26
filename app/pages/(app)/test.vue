<script setup lang="ts">
import type { TFilterDate } from '~/components/filter/FilterDate.vue'

definePageMeta({
  title: 'FormSelectMenu Test'
})

const date = ref<TFilterDate>({
  mode: 'range',
  value: {
    start: '2026-05-21',
    end: '2026-05-30'
  }
})

const onSend = () => {
  $fetch('/api/test', {
    query: {
      date: date.value
    }
  })
}
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-8 p-6">
    <UCard>
      <FilterDate2 v-model="date" />
      <UButton @click="onSend">Send</UButton>

      <pre><code>{{ date }}</code></pre>
    </UCard>
  </div>
</template>
