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
  $fetch(`/api/leads/`, {
    method: 'post',
    body: {
      userIds: [5],
      teamIds: [10],
      customer: {
        name: 'Test Customer2',
        email: 'customer@test.com',
        phone: '01711-234567'
      }
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

const onTestOptions = () => {
  $fetch(`/api/options`, {
    query: {
      type: 'SOURCE',
      // q: 'face',
      // perPage: 2,
      orderBy: {
        name: 'asc'
      }
    }
  })
}
</script>

<template>
  <div>
    <UButton @click="onTest"> Test </UButton>
    <UButton @click="onTestOptions"> Test Options </UButton>
  </div>
</template>
