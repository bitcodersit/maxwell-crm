<script setup lang="ts">
const props = defineProps<{
  lead: TLead
  attachments: TAttachment[]
}>()

const emit = defineEmits<{
  refresh: []
}>()
</script>

<template>
  <div class="pt-6 max-w-3xl space-y-3">
    <div>
      <h3 class="text-sm font-semibold text-highlighted">
        Documents
      </h3>
      <p class="text-xs text-muted mt-0.5">
        Upload and manage files attached to this lead.
      </p>
    </div>
    <FormFileUpload
      mode="upload"
      :model-id="lead.id"
      :attachable-id="lead.attachableId"
      attachable-model-type="lead"
      folder="leads"
      :attachments="attachments"
      @refresh="emit('refresh')"
    />
  </div>
</template>
