<script setup lang="ts">
import { Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  resetLink: string
  name?: string
  expiresInMinutes?: number
}>()
</script>

<template>
  <EmailCardLayout
    preview="Reset your password"
    title="Reset your password"
    :description="`Hi ${name || 'there'}, click the button below to reset your password.`"
    action-label="Reset Password"
    :action-link="resetLink"
    footer="If you did not request this, you can ignore this email."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      This link expires in {{ expiresInMinutes || 5 }} minutes.
    </Text>
  </EmailCardLayout>
</template>
