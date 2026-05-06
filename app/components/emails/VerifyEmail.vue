<script setup lang="ts">
import {
  Body,
  Container,
  Heading,
  Link,
  Preview,
  Section,
  Text,
  Tailwind,
  Html,
  Head,
  Hr,
} from '@vue-email/components'

defineProps<{
  verifyLink: string
  name?: string
}>()
</script>

<template>
  <Html>
    <Head />
    <Tailwind>
      <Body className="bg-white font-raycast">
        <Preview>Verify your email address</Preview>
        <Container
          className="mx-auto my-0 pt-5 px-[25px] pb-12 bg-[url('/static/raycast-bg.png')] [background-position:bottom] [background-repeat:no-repeat]"
        >
          <Heading className="text-[28px] font-bold mt-12">✅ Verify your email</Heading>
          <Section className="my-6 mx-0">
            <Text className="text-base leading-6.5">
              Hi {{ name || 'there' }}, please confirm your email address to complete verification.
            </Text>
            <Text className="text-base leading-6.5">
              <Link className="text-[#FF6363]" :href="verifyLink">
                👉 Verify email now 👈
              </Link>
            </Text>
            <Text className="text-base leading-6.5">
              If you did not request this verification, you can ignore this email.
            </Text>
          </Section>
          <Text className="text-base leading-6.5">
            Best,
            <br />- Maxwell CRM Team
          </Text>
          <Hr className="border-[#dddddd] mt-12" />
          <Text className="text-[#8898aa] text-xs leading-6 ml-1"> Maxwell CRM </Text>
        </Container>
      </Body>
    </Tailwind>
  </Html>
</template>
