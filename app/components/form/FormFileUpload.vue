<script setup lang="ts">
type TAttachableModelType = 'task' | 'lead' | 'followUp' | 'property' | 'visit' | 'comment'

const props = withDefaults(
  defineProps<{
    mode: 'pending' | 'upload'
    modelId?: number
    attachableId?: TMaybe<number>
    attachableModelType?: TAttachableModelType
    attachments?: TAttachment[]
    disabled?: boolean
    folder?: string
  }>(),
  {
    attachments: () => [],
    folder: 'attachments'
  }
)

const emit = defineEmits<{
  refresh: []
}>()

const pendingFiles = defineModel<File[]>('pendingFiles', { default: () => [] })

const inputRef = useTemplateRef('inputRef')
const isDragging = ref(false)
const toast = useToast()
const { getAttachment } = useGetAttachment()
const { mutateAsync, isPending } = useAttachmentsMutation()

const accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.zip'

function addPendingFiles(files: File[]) {
  if (!files.length || props.disabled) return
  pendingFiles.value = [...pendingFiles.value, ...files]
}

function removePendingFile(index: number) {
  pendingFiles.value = pendingFiles.value.filter((_, i) => i !== index)
}

async function uploadFiles(files: File[]) {
  if (!files.length || props.disabled) return
  if (props.mode === 'pending') {
    addPendingFiles(files)
    return
  }
  if (!props.modelId || !props.attachableModelType) return

  try {
    await mutateAsync({
      files,
      folder: props.folder,
      attachableId: props.attachableId ?? undefined,
      attachableModelId: props.modelId,
      attachableModelType: props.attachableModelType
    })
    toast.add({ title: 'Files uploaded', color: 'success' })
    emit('refresh')
  } catch (error) {
    const { message } = parseError(error)
    toast.add({ title: 'Upload failed', description: message, color: 'error' })
  }
}

function onInputChange(event: Event) {
  const input = event.target as HTMLInputElement
  const files = Array.from(input.files || [])
  input.value = ''
  void uploadFiles(files)
}

function onBrowseClick() {
  if (!props.disabled) inputRef.value?.click()
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (!props.disabled) isDragging.value = true
}

function onDragLeave() {
  isDragging.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (props.disabled) return
  const files = Array.from(event.dataTransfer?.files || [])
  void uploadFiles(files)
}

function onDownload(file: TAttachment) {
  const url = getAttachment(file.path)
  if (url) window.open(url, '_blank')
}
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs text-muted">
        <template v-if="mode === 'pending'">
          {{ pendingFiles.length }} file{{ pendingFiles.length === 1 ? '' : 's' }} ready to upload
        </template>
        <template v-else>
          {{ attachments.length }} file{{ attachments.length === 1 ? '' : 's' }} attached
        </template>
      </p>
      <UButton
        icon="i-lucide-upload"
        label="Browse files"
        size="xs"
        :loading="isPending"
        :disabled="disabled"
        @click="onBrowseClick"
      />
    </div>

    <input
      ref="inputRef"
      type="file"
      multiple
      :accept="accept"
      class="hidden"
      :disabled="disabled"
      @change="onInputChange"
    >

    <div
      class="rounded-lg border border-dashed px-3 py-4 text-center transition-colors"
      :class="[
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-elevated/80',
        isDragging ? 'border-primary bg-primary/5' : 'border-default bg-elevated/50'
      ]"
      @click="onBrowseClick"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <UIcon
        name="i-lucide-upload-cloud"
        class="size-5 text-muted mx-auto mb-1"
      />
      <p class="text-xs text-muted">
        Drag and drop files here, or click to browse
      </p>
      <p class="text-[11px] text-dimmed mt-0.5">
        Images and PDFs supported
      </p>
    </div>

    <div
      v-if="mode === 'pending' && pendingFiles.length"
      class="grid grid-cols-1 sm:grid-cols-2 gap-2"
    >
      <div
        v-for="(file, index) in pendingFiles"
        :key="`${file.name}-${index}`"
        class="flex items-start gap-2 rounded-lg border border-default bg-elevated/40 px-2.5 py-2"
      >
        <div class="flex items-center justify-center size-8 rounded-md bg-elevated shrink-0">
          <UIcon
            :name="fileIconForMime(file.type)"
            class="size-4 text-muted"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-highlighted line-clamp-2 break-all leading-snug">
            {{ file.name }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ formatFileSize(file.size) }}
          </p>
        </div>
        <UButton
          type="button"
          icon="i-lucide-x"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          :disabled="disabled"
          @click.stop="removePendingFile(index)"
        />
      </div>
    </div>

    <div
      v-else-if="mode === 'upload' && attachments.length"
      class="grid grid-cols-1 sm:grid-cols-2 gap-2"
    >
      <div
        v-for="file in attachments"
        :key="file.id"
        class="flex items-start gap-2 rounded-lg border border-default bg-elevated/40 px-2.5 py-2"
      >
        <div class="flex items-center justify-center size-8 rounded-md bg-elevated shrink-0">
          <UIcon
            :name="fileIconForMime(file.mime)"
            class="size-4 text-muted"
          />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-highlighted line-clamp-2 break-all leading-snug">
            {{ file.name }}
          </p>
          <p class="text-xs text-muted mt-0.5">
            {{ formatFileSize(file.size) }}
          </p>
        </div>
        <UButton
          type="button"
          icon="i-lucide-download"
          color="neutral"
          variant="ghost"
          size="xs"
          class="shrink-0"
          @click="onDownload(file)"
        />
      </div>
    </div>
  </div>
</template>
