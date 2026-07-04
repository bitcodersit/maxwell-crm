<script setup lang="ts">
definePageMeta({
  title: 'Leads',
  layout: 'leads-layout'
})

const initialQuery = {
  isDefault: true,
  module: BoardModule.LEADS
}

const itemsQuery = ref<Record<string, any>>({})

const getItem = (item: TBoardItem) => {
  return item?.lead as TLead
}
</script>

<template>
  <div class="flex-1 flex flex-col overflow-hidden">
    <div class="px-4 sm:px-6 pb-3 flex-none">
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
  </div>
</template>
