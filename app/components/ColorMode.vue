<template>
  <div>
    <button @click="toggleColorMode" class="bg-blue-500 text-white px-4 rounded-md">
      {{ colorMode.preference === 'dark' ? 'Light Mode' : 'Dark Mode' }}
    </button>
  </div>
</template>

<script setup lang="ts">
const colorMode = useColorMode()
const toggleColorMode = () => {
  colorMode.preference = colorMode.preference === 'dark' ? 'light' : 'dark'
}
</script>
