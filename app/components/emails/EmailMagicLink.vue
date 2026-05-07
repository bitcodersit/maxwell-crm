<script setup lang="ts">
import { Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  magicLink: string
}>()
</script>

<template>
  <EmailCardLayout
    preview="Log in with this magic link"
    title="Your magic link"
    description="Use this link to sign in to your account."
    action-label="Sign In"
    :action-link="magicLink"
    footer="If you did not request this, you can safely ignore this email."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      This link is one-time use and should be used immediately.
    </Text>
  </EmailCardLayout>
</template>
