<script setup lang="ts">
definePageMeta({
  layout: 'auth-layout',
})
</script>

<template>
  <form class="p-6 md:p-8">
    <UiFieldGroup>
      <div class="flex flex-col items-center gap-2 text-center">
        <h1 class="text-2xl font-bold">Welcome back</h1>
        <p class="text-muted-foreground text-balance">Login to your Acme Inc account</p>
      </div>
      <UiField>
        <UiFieldLabel for="email">Email Address</UiFieldLabel>
        <UiInput id="email" type="email" required />
      </UiField>
      <UiField>
        <div class="flex items-center">
          <UiFieldLabel for="password">Password</UiFieldLabel>
          <NuxtLink
            href="/forgot-password"
            class="ml-auto text-sm underline-offset-2 hover:underline text-muted-foreground"
          >
            Forgot your password?
          </NuxtLink>
        </div>
        <UiInput id="password" type="password" required />
      </UiField>
      <UiField>
        <UiButton type="submit"> Login </UiButton>
      </UiField>
      <UiFieldSeparator class="*:data-[slot=field-separator-content]:bg-card">
        Or continue with
      </UiFieldSeparator>
      <UiButton variant="outline" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path
            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
            fill="currentColor"
          />
        </svg>
        Continue with Google
      </UiButton>
    </UiFieldGroup>
  </form>
</template>
