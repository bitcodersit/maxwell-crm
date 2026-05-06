<script setup lang="ts">
import { isVNode } from 'vue'
defineProps<{
  value?: string | VNode
}>()
</script>

<template>
  <component v-if="isVNode(value)" :is="value" />
  <template v-else>{{ value }}</template>
</template>
