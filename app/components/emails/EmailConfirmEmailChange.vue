<script setup lang="ts">
import { Text } from '@vue-email/components'
import EmailCardLayout from './layouts/EmailCardLayout.vue'

defineProps<{
  confirmLink: string
  name?: string
  newEmail: string
}>()
</script>

<template>
  <EmailCardLayout
    preview="Confirm your email change"
    title="Confirm email change request"
    :description="`Hi ${name || 'there'}, you requested to change your account email.`"
    action-label="Confirm Email Change"
    :action-link="confirmLink"
    footer="If this was not you, ignore this email and your current email will remain unchanged."
  >
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      New email requested: <strong>{{ newEmail }}</strong>
    </Text>
    <Text className="text-[14px] leading-6 text-[#374151] my-0">
      After this confirmation, we will send a verification link to the new email address.
    </Text>
  </EmailCardLayout>
</template>
