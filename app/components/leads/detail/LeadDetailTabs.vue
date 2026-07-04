<script setup lang="ts">
const props = defineProps<{
  data: TLeadDetailData
}>()

const tab = defineModel<string>('tab', { default: 'overview' })

defineEmits<{
  refresh: []
}>()

const tabItems = computed(() => [
  {
    label: 'Overview',
    value: 'overview',
    icon: 'i-lucide-layout-dashboard'
  },
  {
    label: 'Follow-ups',
    value: 'follow-ups',
    icon: 'i-lucide-phone-forwarded',
    badge: props.data.followUps.total || undefined
  },
  {
    label: 'Visits',
    value: 'visits',
    icon: 'i-lucide-map-pin',
    badge: props.data.visits.total || undefined
  },
  {
    label: 'Comments',
    value: 'comments',
    icon: 'i-lucide-message-square',
    badge: props.data.comments.total || undefined
  },
  {
    label: 'Attachments',
    value: 'attachments',
    icon: 'i-lucide-paperclip',
    badge: props.data.attachments.length || undefined
  },
  {
    label: 'Properties',
    value: 'properties',
    icon: 'i-lucide-building-2',
    badge: props.data.properties.total || undefined
  }
])
</script>

<template>
  <div class="sticky top-0 z-10 bg-default/80 backdrop-blur-sm border-b border-default -mx-6 px-6">
    <UTabs
      v-model="tab"
      :items="tabItems"
      variant="pill"
      size="sm"
      :content="false"
      class="w-full"
      :ui="{
        trigger: 'gap-1.5',
        leadingIcon: 'size-3.5'
      }"
    />
  </div>

  <LeadDetailOverview
    v-if="tab === 'overview'"
    :lead="data.lead"
  />
  <LeadDetailFollowUps
    v-else-if="tab === 'follow-ups'"
    :follow-ups="data.followUps"
    @refresh="$emit('refresh')"
  />
  <LeadDetailVisits
    v-else-if="tab === 'visits'"
    :visits="data.visits"
    @refresh="$emit('refresh')"
  />
  <LeadDetailComments
    v-else-if="tab === 'comments'"
    :lead="data.lead"
    :comments="data.comments"
    @refresh="$emit('refresh')"
  />
  <LeadDetailAttachments
    v-else-if="tab === 'attachments'"
    :lead="data.lead"
    :attachments="data.attachments"
    @refresh="$emit('refresh')"
  />
  <LeadDetailProperties
    v-else-if="tab === 'properties'"
    :lead="data.lead"
    :properties="data.properties"
    @refresh="$emit('refresh')"
  />
</template>
