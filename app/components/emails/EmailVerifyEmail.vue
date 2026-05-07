<script setup lang="ts">
import { Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  verifyLink: string
  name?: string
}>()
</script>

<template>
  <EmailCardLayout
    preview="Verify your email address"
    title="Verify your email"
    :description="`Hi ${name || 'there'}, please verify your email address to keep your account active.`"
    action-label="Verify Email"
    :action-link="verifyLink"
    footer="If you did not request this verification, you can ignore this email."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      This verification link is valid for 24 hours.
    </Text>
  </EmailCardLayout>
</template>
