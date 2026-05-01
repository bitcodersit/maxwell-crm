<template>
  <div class="flex flex-col items-center justify-center gap-4 p-4 min-h-screen">
    <UColorModeButton class="absolute top-4 right-4" />
    <UPageCard class="w-full max-w-sm lg:max-w-3xl lg:aspect-4/3" variant="subtle">
      <div class="flex gap-6">
        <div class="flex flex-col items-center justify-center flex-1">
          <slot />
        </div>
        <USeparator orientation="vertical" class="hidden lg:block" />
        <div class="flex-col gap-2 items-center justify-center flex-1 hidden lg:flex">
          <NuxtImg src="/assets/img/logo.png" alt="Maxwell Group" height="100" fit="contain" />
        </div>
      </div>
    </UPageCard>
  </div>
</template>
