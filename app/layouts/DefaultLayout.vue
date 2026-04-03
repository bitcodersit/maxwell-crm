<template>
  <div class="bg-white dark:bg-neutral-900 dark:text-white h-screen">
    <header class="flex items-center justify-between p-4 border-b">
      <div>
        <h1>Maxwell CRM</h1>
      </div>
      <div>
        <ColorMode />
      </div>
    </header>
    <slot />
  </div>
</template>
