<script setup lang="ts">
definePageMeta({
  title: 'Leads',
  layout: 'leads-layout'
})

const getItem = (item: TBoardItem) => {
  return item?.lead as TLead
}
</script>

<template>
  <BaseKanban
    :board-name="'leads-default'"
    :get-item="getItem"
  >
    <template #item="{ item }">
      <div>
        {{ item.sid }}
      </div>
    </template>
  </BaseKanban>
</template>
