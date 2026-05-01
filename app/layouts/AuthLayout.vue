<script setup lang="ts">
//
</script>

<template>
  <div class="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
    <div class="w-full max-w-sm md:max-w-4xl">
      <div class="flex flex-col gap-6">
        <UiCard class="overflow-hidden p-0">
          <UiCardContent class="grid p-0 md:grid-cols-2">
            <slot />
            <div class="bg-muted relative hidden md:block">
              <img
                src="/assets/img/placeholder.svg"
                alt="Image"
                class="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              />
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </div>
  </div>
</template>
