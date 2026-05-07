<script setup lang="ts">
import { Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  name?: string
  loginEmail: string
  loginPassword: string
  loginUrl: string
}>()
</script>

<template>
  <EmailCardLayout
    preview="Your password was updated"
    title="Password updated"
    :description="`Hi ${name || 'there'}, your account password has been updated.`"
    action-label="Go to login"
    :action-link="loginUrl"
    footer="If you did not request this change, contact your administrator immediately."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">Login URL: {{ loginUrl }}</Text>
    <Text className="text-[14px] leading-6 text-[#374151] my-0">Email: {{ loginEmail }}</Text>
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      New password: {{ loginPassword }}
    </Text>
  </EmailCardLayout>
</template>
