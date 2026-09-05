<script setup lang="ts">
const initialQuery = {
  isDefault: true,
  module: BoardModule.LEADS
}

definePageMeta({
  layout: false
})

const itemsQuery = ref<Record<string, any>>({})

const getItem = (item: TBoardItem) => {
  return item?.lead as TLead
}
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <div class="px-4 sm:px-6 flex-none mt-4 sm:mt-6">
      <LeadListFilters v-model="itemsQuery" />
    </div>
    <BaseKanban
      :initial-query="initialQuery"
      :items-query="itemsQuery"
      :get-item="getItem"
    >
      <template #item="{ item }">
        <LeadBoardCard
          v-if="item"
          :lead="item"
        />
      </template>
    </BaseKanban>
  </NuxtLayout>
</template>
