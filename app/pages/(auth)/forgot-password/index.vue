<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

useHead({ title: 'Forgot Password' })
definePageMeta({ layout: 'auth' })

const auth = ref()
const infoModal = useInfoModal()
const loading = ref(false)
const cooldown = ref(0)
const COOLDOWN_KEY = 'forgot-password:cooldown-until'

let timer: ReturnType<typeof setInterval> | null = null
const stopTimer = () => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
const clearStoredCooldown = () => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(COOLDOWN_KEY)
}
const setStoredCooldown = (untilMs: number) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(COOLDOWN_KEY, String(untilMs))
}
const getStoredCooldown = () => {
  if (typeof window === 'undefined') return 0
  const raw = Number(localStorage.getItem(COOLDOWN_KEY) || 0)
  return Number.isFinite(raw) ? raw : 0
}
const startCooldown = (seconds: number) => {
  stopTimer()
  const untilMs = Date.now() + Math.max(0, Math.floor(seconds)) * 1000
  setStoredCooldown(untilMs)
  const updateCooldown = () => {
    const remaining = Math.ceil((untilMs - Date.now()) / 1000)
    cooldown.value = Math.max(0, remaining)
    if (!cooldown.value) {
      stopTimer()
      clearStoredCooldown()
    }
  }
  updateCooldown()
  if (!cooldown.value) return
  timer = setInterval(() => {
    updateCooldown()
  }, 1000)
}

const canSubmit = computed(() => !loading.value && cooldown.value <= 0)
const countdownText = computed(() => {
  if (!cooldown.value) return ''
  return `You can request again in ${cooldown.value}s`
})
const emailDescription = computed(() => {
  return countdownText.value || 'We will send a reset link to this email.'
})

const parseRetryAfter = (error: any) => {
  const retry = Number(error?.data?.data?.retryAfterSec)
  return Number.isFinite(retry) ? retry : 0
}

const onSubmit = async (event: FormSubmitEvent<any>) => {
  if (!canSubmit.value) return
  try {
    loading.value = true
    const response = await $fetch<{ message?: string; retryAfterSec?: number }>(
      '/api/password/forgot',
      {
        method: 'POST',
        body: {
          email: event.data.email,
        },
      }
    )
    startCooldown(response.retryAfterSec ?? 60)
    infoModal.open({
      title: 'Success',
      body: response.message,
    })
  } catch (error) {
    const retryAfter = parseRetryAfter(error)
    if (retryAfter > 0) {
      startCooldown(retryAfter)
    }
    const { message, errors } = parseError(error)
    if (errors?.length) auth.value?.formRef?.setErrors?.(errors)
    else auth.value?.formRef?.setErrors?.([{ name: 'email', message }])
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(stopTimer)
onMounted(() => {
  const untilMs = getStoredCooldown()
  if (untilMs > Date.now()) {
    const remaining = Math.ceil((untilMs - Date.now()) / 1000)
    startCooldown(remaining)
  } else {
    clearStoredCooldown()
  }
})
</script>

<template>
  <div class="w-full max-w-sm space-y-4">
    <UAuthForm
      ref="auth"
      title="Forgot password"
      description="Enter your email and we will send a reset link valid for 5 minutes."
      :loading="loading"
      :fields="[
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          description: emailDescription,
          placeholder: 'Enter your email',
          required: true,
        },
      ]"
      :submit="{
        label: 'Send reset link',
        disabled: !!cooldown,
      }"
      @submit="onSubmit"
    />
    <div class="text-sm text-center">
      <NuxtLink to="/login" class="text-primary hover:underline">Back to login</NuxtLink>
    </div>
  </div>
</template>
