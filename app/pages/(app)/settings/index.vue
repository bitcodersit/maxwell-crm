<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const fileRef = ref<HTMLInputElement>()
const pendingFile = ref<File | null>(null)
const previewUrl = ref<string | null>(null)
const clearAvatar = ref(false)

const { user, fetch: fetchSession } = useUserSession()

const { getAttachment } = useGetAttachment()

const profileSchema = z.object({
  name: z.string().min(2, 'Too short'),
})

type ProfileSchema = z.output<typeof profileSchema>

const profile = reactive({
  name: '',
})

watch(
  user,
  (u) => {
    if (u) {
      profile.name = u.name
    }
  },
  { immediate: true }
)

watch(pendingFile, (f) => {
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
  return getAttachment(user.value?.avatarId)
})

const toast = useToast()

async function onSubmit(event: FormSubmitEvent<ProfileSchema>) {
  try {
    let newAvatarId: number | undefined
    if (pendingFile.value) {
      const fd = new FormData()
      fd.append('file', pendingFile.value)
      const up = await $fetch<{ id: number; url: string }>('/api/attachments', {
        method: 'POST',
        body: fd,
      })
      newAvatarId = up.id
    }

    const body: { name?: string; avatarId?: number | null } = {
      name: event.data.name,
    }
    if (clearAvatar.value) {
      body.avatarId = null
    } else if (newAvatarId !== undefined) {
      body.avatarId = newAvatarId
    }

    await $fetch('/api/me', {
      method: 'PUT',
      body,
    })

    pendingFile.value = null
    clearAvatar.value = false
    await fetchSession()

    toast.add({
      title: 'Success',
      description: 'Your settings have been updated.',
      icon: 'i-lucide-check',
      color: 'success',
    })
  } catch (error: any) {
    toast.add({
      title: 'Error',
      description: error.data.message ?? error.message ?? 'Update failed',
      color: 'error',
    })
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
</script>

<template>
  <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
    <UPageCard
      title="Profile"
      description="These informations will be displayed publicly."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <UButton
        form="settings"
        label="Save changes"
        color="neutral"
        type="submit"
        class="w-fit lg:ms-auto"
      />
    </UPageCard>

    <UPageCard variant="subtle">
      <UFormField
        name="name"
        label="Name"
        description="Will appear on receipts, invoices, and other communication."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput v-model="profile.name" autocomplete="off" />
      </UFormField>
      <!--
      <USeparator />
      <UFormField
        name="email"
        label="Email"
        description="Used to sign in, for email receipts and product updates."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.email"
          type="email"
          autocomplete="off"
        />
      </UFormField>
      <USeparator />
      <UFormField
        name="username"
        label="Username"
        description="Your unique username for logging in and your profile URL."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <UInput
          v-model="profile.username"
          type="username"
          autocomplete="off"
        />
      </UFormField>
      -->
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
          <UButton label="Choose" color="neutral" @click="onFileClick" />
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
