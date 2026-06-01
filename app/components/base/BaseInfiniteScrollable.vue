<script setup lang="ts">
const props = defineProps<{
  fetchNextPage: () => void
  isFetchingNextPage: boolean
}>()

const onScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
    props.fetchNextPage()
  }
}
</script>

<template>
  <slot :on-scroll="onScroll" />
  <div
    v-if="isFetchingNextPage"
    class="flex justify-center"
  >
    <UButton
      loading
      variant="link"
    />
  </div>
</template>
