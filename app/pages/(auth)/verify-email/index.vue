<script setup lang="ts">
useHead({ title: 'Verify Email' })
definePageMeta({ layout: false })

const route = useRoute()
const { user, refetch } = useCurrentUser()

const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const loading = ref(true)
const success = ref(false)
const flow = ref<'normal' | 'email-change'>('normal')
const title = ref('Email Verification')
const message = ref('Verifying your email...')
const isLoggedIn = computed(() => !!user.value?.id)

const closeWindow = () => {
  window.close()
}

const verifyEmail = async () => {
  if (!token.value) {
    loading.value = false
    success.value = false
    title.value = 'Verification failed'
    message.value = 'Invalid verification link'
    return
  }

  loading.value = true
  try {
    const response = await $fetch<{
      message?: string
      flow?: 'normal' | 'email-change'
      forceLogout?: boolean
    }>('/api/users/verify-email', {
      query: {
        token: token.value
      }
    })
    success.value = true
    flow.value = (response?.flow as typeof flow.value) || 'normal'
    if (flow.value === 'email-change') {
      title.value = 'Email change successful'
      message.value = 'Email change success. You must login with your new email.'
    } else {
      title.value = 'Email verified'
      message.value = 'Email has been verified. You can now close this window.'
    }
    if (response?.forceLogout) {
      await refetch()
    }
  } catch (error: any) {
    success.value = false
    title.value = 'Verification failed'
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
            :class="[
              loading ? 'animate-spin text-primary' : success ? 'text-success' : 'text-error'
            ]"
          />
          <span>{{ title }}</span>
        </div>
      </template>

      <p class="text-sm text-muted">{{ message }}</p>

      <template #footer>
        <div class="flex justify-end gap-2">
          <template v-if="success && flow === 'normal'">
            <UButton
              v-if="isLoggedIn"
              to="/settings"
              icon="i-lucide-user"
              :disabled="loading"
            >
              Go to profile
            </UButton>
            <UButton
              v-else
              to="/login"
              icon="i-lucide-log-in"
              :disabled="loading"
              >Go to login</UButton
            >
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-x"
              :disabled="loading"
              @click="closeWindow"
            >
              Close window
            </UButton>
          </template>
          <template v-else-if="success && flow === 'email-change'">
            <UButton
              to="/login"
              icon="i-lucide-log-in"
              :disabled="loading"
              >Go to login</UButton
            >
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-x"
              :disabled="loading"
              @click="closeWindow"
            >
              Close window
            </UButton>
          </template>
          <template v-else>
            <UButton
              to="/login"
              icon="i-lucide-log-in"
              :disabled="loading"
              >Go to login</UButton
            >
          </template>
        </div>
      </template>
    </UCard>
  </div>
</template>
