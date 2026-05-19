<script setup lang="ts">
definePageMeta({
  title: 'Leads',
  layout: 'leads-layout'
})

const initialQuery = {
  isDefault: true,
  module: BoardModule.LEADS
}

const getItem = (item: TBoardItem) => {
  return item?.lead as TLead
}
</script>

<template>
  <BaseKanban
    :initial-query="initialQuery"
    :get-item="getItem"
  >
    <template #item="{ item }">
      <UCard :title="`#${item.id}`">
        <div class="text-sm text-muted">
          {{ item.sid }}, {{ item.createdAt }}, {{ item.updatedAt }}
        </div>
      </UCard>
    </template>
  </BaseKanban>
</template>
