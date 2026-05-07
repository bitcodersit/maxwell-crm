<script setup lang="ts">
import { Link, Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  name?: string
  loginEmail: string
  loginUrl: string
  loginPassword?: string
  resetLink?: string
  verifyLink?: string
}>()
</script>

<template>
  <EmailCardLayout
    preview="Welcome to Maxwell CRM"
    title="Welcome to Maxwell CRM"
    :description="`Hi ${name || 'there'}, your account is ready.`"
    :action-label="resetLink ? 'Set password' : 'Go to login'"
    :action-link="resetLink || loginUrl"
    footer="If you did not expect this account, please contact your administrator."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">Login URL: {{ loginUrl }}</Text>
    <Text className="text-[14px] leading-6 text-[#374151] my-0">Email: {{ loginEmail }}</Text>
    <Text v-if="loginPassword" className="text-[14px] leading-6 text-[#374151] my-0">
      Temporary password: {{ loginPassword }}
    </Text>
    <Text v-else className="text-[14px] leading-6 text-[#374151] my-0">
      Use the button above to set your password first.
    </Text>
    <Text v-if="verifyLink" className="text-[14px] leading-6 text-[#374151] my-0">
      Verify email:
      <Link :href="verifyLink" className="text-[#111827] underline">Click here</Link>
    </Text>
  </EmailCardLayout>
</template>
