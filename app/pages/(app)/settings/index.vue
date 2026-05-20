<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { z } from 'zod'

const fileRef = ref<HTMLInputElement>()
const pendingFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const clearAvatar = ref(false)
const loading = ref(false)
const emailEditable = ref(false)
const pendingEmail = ref<string | null>(null)
const pendingEmailStage = ref<string | null>(null)

const { user, refetch } = useCurrentUser()
const { getAttachment } = useGetAttachment()

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
  email: z.email('Invalid email address')
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive({
  name: '',
  email: ''
})

watch(
  user,
  u => {
    if (u) {
      profile.name = u.name
      profile.email = u.email
      emailEditable.value = false
    }
  },
  { immediate: true }
)

watch(pendingFile, f => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (f) {
    previewUrl.value = URL.createObjectURL(f)
  }
})

onBeforeUnmount(() => {
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
  }
})

const avatarSrc = computed(() => {
  if (clearAvatar.value) {
    return undefined
  }
  if (previewUrl.value) {
    return previewUrl.value
  }
  return getAttachment(user.value?.avatar?.path)
})

const toast = useToast()

const isFetchingPendingEmailChange = ref(false)
const fetchPendingEmailChange = async () => {
  try {
    isFetchingPendingEmailChange.value = true
    const res = await $fetch<{
      pendingEmail: string | null
      stage: string | null
    }>('/api/me/pending-email-change')
    pendingEmail.value = res.pendingEmail
    pendingEmailStage.value = res.stage
  } catch {
    pendingEmail.value = null
    pendingEmailStage.value = null
  } finally {
    isFetchingPendingEmailChange.value = false
  }
}

onMounted(fetchPendingEmailChange)

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  try {
    loading.value = true
    const currentEmail = user.value?.email || ''
    const requestedEmail = event.data.email.trim().toLowerCase()
    const isEmailChangeRequested = requestedEmail !== currentEmail.toLowerCase()

    let newAvatarId: number | undefined
    if (pendingFile.value) {
      const fd = new FormData()
      fd.append('files', pendingFile.value)
      const attachments = await $fetch('/api/attachments', {
        method: 'POST',
        body: fd
      })
      newAvatarId = attachments[0]?.id
    }

    const body: { name?: string; email?: string; avatarId?: number | null } = {
      name: event.data.name,
      email: requestedEmail
    }
    if (clearAvatar.value) {
      body.avatarId = null
    } else if (newAvatarId !== undefined) {
      body.avatarId = newAvatarId
    }

    await $fetch('/api/me', {
      method: 'PUT',
      body
    })

    pendingFile.value = null
    clearAvatar.value = false
    emailEditable.value = false
    await refetch()
    await fetchPendingEmailChange()

    toast.add({
      title: 'Success',
      description: isEmailChangeRequested
        ? 'Profile updated. Please confirm from your old email address.'
        : 'Your settings have been updated.',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data.message ?? error.message ?? 'Update failed',
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  clearAvatar.value = false
  if (!input.files?.length) {
    pendingFile.value = null
    return
  }
  pendingFile.value = input.files[0]!
}

function onFileClick() {
  fileRef.value?.click()
}

function onClearAvatar() {
  pendingFile.value = null
  clearAvatar.value = true
}

const emailCache = ref<string>('')
const onChangeEmail = () => {
  emailEditable.value = true
  emailCache.value = profile.email
}

const onCancelEmailChange = () => {
  emailEditable.value = false
  profile.email = emailCache.value
}
</script>

<template>
  <UForm
    id="settings"
    :schema="profileSchema"
    :state="profile"
    @submit="onSubmit"
  >
    <UPageCard
      title="Profile"
      description="These informations will be displayed publicly."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        :loading="loading"
        :disabled="loading"
        form="settings"
        label="Save changes"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        required
        name="name"
        label="Full Name"
        description="Will appear on receipts, invoices, and other communication."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.name"
          autocomplete="off"
          class="min-w-48 w-full"
        />
      </UFormField>
      <USeparator />
      <div>
        <UFormField
          required
          name="email"
          label="Email Address"
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <template #description>
            <ClientOnly>
              <div>Used to sign in, for email receipts and product updates.</div>
              <template v-if="pendingEmail">
                <div
                  v-if="pendingEmailStage === 'old-confirm'"
                  class="text-warning"
                >
                  You have a pending email <b class="underline">`{{ pendingEmail }}`</b> change
                  request. Please check your current email address to confirm the change.
                </div>
                <div
                  v-else-if="pendingEmailStage === 'new-verify'"
                  class="text-warning"
                >
                  Email is not verified. An email has been sent to
                  <b class="underline">`{{ pendingEmail }}`</b> to verify.
                </div>
              </template>
            </ClientOnly>
          </template>
          <UInput
            v-model="profile.email"
            type="email"
            autocomplete="off"
            class="min-w-48 w-full"
            :disabled="!emailEditable"
          />
        </UFormField>
        <ClientOnly>
          <div
            v-if="!isFetchingPendingEmailChange"
            class="flex justify-end"
          >
            <UButton
              v-if="!emailEditable && pendingEmailStage !== 'old-confirm'"
              size="xs"
              color="neutral"
              variant="soft"
              @click="onChangeEmail"
            >
              Change email
            </UButton>
            <UButton
              v-else-if="emailEditable"
              size="xs"
              color="error"
              variant="outline"
              @click="onCancelEmailChange"
            >
              Cancel
            </UButton>
          </div>
        </ClientOnly>
      </div>
      <USeparator />
      <UFormField
        name="avatar"
        label="Avatar"
        description="JPG, GIF or PNG. 1MB Max."
        class="flex max-sm:flex-col justify-between sm:items-center gap-4"
      >
        <div class="flex flex-wrap items-center gap-3">
          <UAvatar
            :key="avatarSrc ?? user?.avatarId ?? 'no-avatar'"
            :src="avatarSrc"
            :alt="profile.name"
            size="lg"
          />
          <UButton
            label="Choose"
            color="neutral"
            @click="onFileClick"
          />
          <UButton
            v-if="user?.avatarId || pendingFile"
            label="Remove"
            color="neutral"
            variant="outline"
            @click="onClearAvatar"
          />
          <input
            ref="fileRef"
            type="file"
            class="hidden"
            accept=".jpg, .jpeg, .png, .gif"
            @change="onFileChange"
          />
        </div>
      </UFormField>

      <!--
      <USeparator />
      <UFormField
        name="bio"
        label="Bio"
        description="Brief description for your profile. URLs are hyperlinked."
        class="flex max-sm:flex-col justify-between items-start gap-4"
        :ui="{ container: 'w-full' }"
      >
        <UTextarea
          v-model="profile.bio"
          :rows="5"
          autoresize
          class="w-full"
        />
      </UFormField>
      -->
    </UPageCard>
  </UForm>
</template>
