<script setup lang="ts">
definePageMeta({
  title: 'Kanban Test'
  // layout: {
  //   name: 'default',
  //   props: {
  //     padding: false
  //   }
  // }
})

const onTest = () => {
  $fetch(`/api/leads/${31}`, {
    method: 'PATCH',
    body: {
      userIds: [5],
      teamIds: [10]
      // customerId: 19,
      // address: {
      //   addressLine1: '123 Main St',
      //   road: 'Anytown',
      //   block: 'Block A'
      // },
      // sourceId: 9,
      // propertyTypeMainId: 3,
      // propertyTypeSubId: 6
    }
  })
}
</script>

<template>
  <div>
    <UButton @click="onTest"> Test </UButton>
  </div>
</template>
