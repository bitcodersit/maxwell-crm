<script setup lang="ts">
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

useHead({ title: 'Reset Password' })
definePageMeta({ layout: 'auth' })

const route = useRoute()
const router = useRouter()
const UButton = resolveComponent('UButton')
const infoModal = useInfoModal()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

type TResetForm = {
  password: string
  passwordConfirmation: string
}

const state = reactive<TResetForm>({
  password: '',
  passwordConfirmation: '',
})

const formRef = ref<{ setErrors?: (errors: FormError[]) => void }>()

const loading = ref(false)
const onSubmit = async (event: FormSubmitEvent<TResetForm>) => {
  if (!token.value) {
    formRef.value?.setErrors?.([
      {
        name: 'password',
        message: 'Reset token is missing.',
      },
    ])
    return
  }
  try {
    loading.value = true
    const response = await $fetch<{ message?: string }>('/api/password/reset', {
      method: 'POST',
      body: {
        ...event.data,
        token: token.value,
      },
    })
    infoModal.open({
      title: 'Password reset complete',
      body: response.message,
    })
    router.push('/login')
  } catch (error) {
    const { message, errors } = parseError(error)
    if (errors?.length) formRef.value?.setErrors?.(errors)
    else formRef.value?.setErrors?.([{ name: 'password', message }])
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full max-w-sm space-y-4">
    <div class="space-y-1">
      <h1 class="text-xl font-semibold">Reset password</h1>
      <p class="text-sm text-muted">Set a new password for your account.</p>
    </div>
    <UForm ref="formRef" :state="state" class="space-y-4" @submit="onSubmit">
      <UFormField label="New password" name="password" required>
        <UInput
          v-model="state.password"
          type="password"
          placeholder="Enter new password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UFormField label="Confirm password" name="passwordConfirmation" required>
        <UInput
          v-model="state.passwordConfirmation"
          type="password"
          placeholder="Confirm new password"
          autocomplete="new-password"
          class="w-full"
        />
      </UFormField>
      <UButton type="submit" :loading="loading" class="w-full justify-center">
        Reset password
      </UButton>
    </UForm>
    <div class="text-sm text-center">
      <NuxtLink to="/login" class="text-primary hover:underline">Back to login</NuxtLink>
    </div>
  </div>
</template>
