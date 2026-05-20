<script setup lang="ts">
definePageMeta({
  title: 'FormSelectMenu Test'
})

const singlePurchaseType = ref<number | null>(null)
const multipleUsers = ref([])
</script>

<template>
  <div class="mx-auto flex max-w-xl flex-col gap-8 p-6">
    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Single select</h2>
      <p class="text-sm text-muted">
        Purchase types (one page) — search hidden when the API returns a single page.
      </p>
      <FormSelectMenu
        v-model="singlePurchaseType"
        :api="'/api/options'"
        :query="{ type: 'PROPERTY_PURCHASE_TYPE' }"
        clear
        size="xl"
        placeholder="Select purchase type"
      />
      <pre class="rounded-md bg-elevated p-3 text-sm">modelValue: {{ singlePurchaseType }}</pre>
    </section>

    <section class="flex flex-col gap-3">
      <h2 class="text-lg font-semibold">Multiple select</h2>
      <p class="text-sm text-muted">
        Users (paginated) — search shown when the API response has more than one page.
      </p>
      <FormSelectMenu
        v-model="multipleUsers"
        :api="'/api/users'"
        :query="{ options: true }"
        clear
        multiple
        placeholder="Select users"
        size="xl"
      />
      <pre class="rounded-md bg-elevated p-3 text-sm">modelValue: {{ multipleUsers }}</pre>
    </section>
  </div>
</template>
