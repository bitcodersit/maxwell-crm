<script setup lang="ts">
useHead({ title: 'Verify Email' })
definePageMeta({ layout: false })

const route = useRoute()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const loading = ref(true)
const success = ref(false)
const message = ref('Verifying your email...')

const verifyEmail = async () => {
  if (!token.value) {
    loading.value = false
    success.value = false
    message.value = 'Invalid verification link'
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{ message?: string }>('/api/users/verify-email', {
      query: {
        token: token.value,
      },
    })
    success.value = true
    message.value = response?.message || 'Email verified successfully'
  } catch (error: any) {
    success.value = false
    message.value = error?.data?.message || error?.message || 'Verification failed'
  } finally {
    loading.value = false
  }
}

onMounted(verifyEmail)
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <UCard class="max-w-lg w-full">
      <template #header>
        <div class="flex items-center gap-2 text-lg font-semibold">
          <UIcon
            :name="
              loading
                ? 'i-lucide-loader-circle'
                : success
                  ? 'i-lucide-badge-check'
                  : 'i-lucide-circle-alert'
            "
            :class="[loading ? 'animate-spin text-primary' : success ? 'text-success' : 'text-error']"
          />
          <span>Email Verification</span>
        </div>
      </template>

      <p class="text-sm text-muted">{{ message }}</p>

      <template #footer>
        <div class="flex justify-end">
          <UButton to="/login" icon="i-lucide-log-in" :disabled="loading"> Go to login </UButton>
        </div>
      </template>
    </UCard>
  </div>
</template>
