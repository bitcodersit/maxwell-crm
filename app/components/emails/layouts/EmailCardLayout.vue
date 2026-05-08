<script setup lang="ts">
import { Body, Container, Head, Html, Link, Preview, Section, Text, Tailwind } from '@vue-email/components'

defineProps<{
  preview?: string
  title: string
  description: string
  actionLabel?: string
  actionLink?: string
  footer?: string
}>()
</script>

<template>
  <Html>
    <Head />
    <Tailwind>
      <Body className="bg-[#f3f4f6] py-8 px-3">
        <Preview>{{ preview || title }}</Preview>
        <Container className="mx-auto w-full max-w-[560px]">
          <Section className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <Section className="h-36 rounded-lg border border-[#d1d5db] bg-[#e5e7eb] mb-6" />
            <Text className="text-[24px] leading-8 font-semibold text-[#111827] m-0">{{ title }}</Text>
            <Text className="text-[15px] leading-6 text-[#4b5563] mt-3 mb-0">{{ description }}</Text>
            <Section className="mt-5">
              <slot />
            </Section>
            <Section v-if="actionLabel && actionLink" className="mt-6 mb-2">
              <Link
                :href="actionLink"
                className="inline-block rounded-md bg-[#111827] text-white no-underline px-4 py-2 text-[14px] font-medium"
              >
                {{ actionLabel }}
              </Link>
            </Section>
            <Text className="text-[12px] leading-5 text-[#6b7280] mt-6 mb-0">
              {{ footer || 'Maxwell CRM' }}
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
</template>
