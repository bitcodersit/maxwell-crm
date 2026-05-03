<script setup lang="ts">
import * as z from 'zod'
import type { FormError, FormSubmitEvent } from '@nuxt/ui'

const passwordSchema = z
  .object({
    current: z.string().min(8, 'Must be at least 8 characters'),
    new: z.string().min(8, 'Must be at least 8 characters'),
    confirm: z.string().min(8, 'Must be at least 8 characters'),
  })
  .refine((data) => data.new === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })
  .refine((data) => data.current !== data.new, {
    message: 'New password must be different from your current password',
    path: ['new'],
  })

type PasswordSchema = z.output<typeof passwordSchema>

const password = reactive<Partial<PasswordSchema>>({
  current: '',
  new: '',
  confirm: '',
})

const validate = (state: Partial<PasswordSchema>): FormError[] => {
  const parsed = passwordSchema.safeParse(state)
  if (parsed.success) {
    return []
  }
  const fieldErrors = parsed.error.flatten().fieldErrors
  const errors: FormError[] = []
  for (const key of ['current', 'new', 'confirm'] as const) {
    const msg = fieldErrors[key]?.[0]
    if (msg) {
      errors.push({ name: key, message: msg })
    }
  }
  return errors
}

const passwordForm = ref<{ setErrors?: (errors: FormError[]) => void }>()
const loading = ref(false)
const toast = useToast()

async function onSubmit(event: FormSubmitEvent<PasswordSchema>) {
  try {
    loading.value = true
    await $fetch('/api/me/password', {
      method: 'PUT',
      body: {
        current: event.data.current,
        new: event.data.new,
      },
    })
    password.current = ''
    password.new = ''
    password.confirm = ''
    toast.add({
      title: 'Success',
      description: 'Your password has been updated.',
      icon: 'i-lucide-check',
      color: 'success',
    })
  } catch (error: unknown) {
    const err = error as {
      data?: { message?: string; data?: { properties?: Record<string, { errors: string[] }> } }
    }
    const properties = err.data?.data?.properties ?? {}
    const entries = Object.entries(properties).flatMap(([name, value]) => {
      const message = value?.errors?.[0]
      return message ? [{ name, message }] : []
    })
    if (entries.length && passwordForm.value?.setErrors) {
      passwordForm.value.setErrors(entries)
    } else {
      toast.add({
        title: 'Error',
        description: err.data?.message ?? 'Could not update password',
        color: 'error',
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Password"
    description="Confirm your current password before setting a new one."
    variant="subtle"
  >
    <UForm
      ref="passwordForm"
      :schema="passwordSchema"
      :state="password"
      :validate="validate"
      class="flex flex-col gap-4 max-w-xs"
      @submit="onSubmit"
    >
      <UFormField label="Current password" name="current" required>
        <UInput
          v-model="password.current"
          type="password"
          autocomplete="current-password"
          placeholder="Current password"
          class="w-full"
        />
      </UFormField>

      <UFormField label="New password" name="new" required>
        <UInput
          v-model="password.new"
          type="password"
          autocomplete="new-password"
          placeholder="New password"
          class="w-full"
        />
      </UFormField>

      <UFormField label="Confirm new password" name="confirm" required>
        <UInput
          v-model="password.confirm"
          type="password"
          autocomplete="new-password"
          placeholder="Confirm new password"
          class="w-full"
        />
      </UFormField>

      <UButton label="Update password" class="w-fit" type="submit" :loading="loading" />
    </UForm>
  </UPageCard>

  <!-- <UPageCard
    title="Account"
    description="No longer want to use our service? You can delete your account here. This action is not reversible. All information related to this account will be deleted permanently."
    class="bg-linear-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UButton label="Delete account" color="error" />
    </template>
  </UPageCard> -->
</template>
