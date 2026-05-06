<script setup lang="ts">
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

useHead({ title: 'Login' })
definePageMeta({ layout: 'auth' })

const auth = ref()
const fields: AuthFormField[] = [
  {
    name: 'email',
    type: 'email',
    label: 'Email',
    placeholder: 'Enter your email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
    required: true,
  },
]

const loading = ref(false)
const onSubmit = async (event: FormSubmitEvent<any>) => {
  loading.value = true
  $fetch('/api/login', {
    method: 'POST',
    body: JSON.stringify(event.data),
  })
    .then(() => {
      location.href = '/'
    })
    .catch((error) => {
      const properties: any = error.data?.data?.properties || {}
      const entries = Object.entries(properties)
      if (!entries.length) {
        auth.value.formRef.setErrors([
          {
            name: 'email',
            message: error.data?.message || error.message || 'Error while logging in',
          },
        ])
      } else {
        auth.value.formRef.setErrors(
          Object.entries(properties).map(([name, value]: any) => {
            return {
              name,
              message: value?.errors?.[0],
            }
          })
        )
      }
    })
    .finally(() => {
      loading.value = false
    })
}
</script>

<template>
  <div class="w-full max-w-sm space-y-4">
    <UAuthForm
      ref="auth"
      title="Welcome back"
      description="Enter your email and password to access your account."
      :fields="fields"
      :loading="loading"
      @submit="onSubmit"
    />
    <div class="text-sm text-center">
      <NuxtLink to="/forgot-password" class="text-primary hover:underline">
        Forgot your password?
      </NuxtLink>
    </div>
  </div>
</template>
