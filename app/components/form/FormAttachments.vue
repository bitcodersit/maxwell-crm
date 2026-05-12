<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    accept?: string
    multiple?: boolean
    folder?: string
    attachableId?: number
    attachableField?: string
  }>(),
  {
    multiple: true,
    accept: 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv'
  }
)

const inputRef = useTemplateRef('inputRef')
const attachments = defineModel<TAttachment[]>({
  default: () => []
})

const { mutateAsync, isPending } = useAttachmentsMutation()
const { getAttachment } = useGetAttachment()

const pdfViewer = usePDFViewer()
const promiseToast = usePromiseToast()

const onInput = (e: Event) => {
  const input = e.target as HTMLInputElement

  const files = Array.from(input.files || [])
  if (!files.length) return

  if (inputRef.value?.inputRef) {
    inputRef.value.inputRef.value = ''
    inputRef.value.inputRef.files = null
  }

  promiseToast(
    ({ onSuccess, onError }) => {
      return mutateAsync(
        {
          files,
          folder: props.folder,
          attachableId: props.attachableId,
          attachableField: props.attachableField
        },
        {
          onError,
          onSuccess(res) {
            onSuccess(res)
            attachments.value = [...attachments.value, ...res]
          }
        }
      )
    },
    {
      title: 'Uploading attachments...',
      description: `Don't close this page, please wait while we upload the attachments...`
    },
    () => ({
      title: 'Attachments uploaded',
      description: 'Attachments uploaded successfully'
    }),
    err => {
      const { message, errors } = parseError(err)
      return {
        title: 'Failed to upload attachments',
        description: errors?.length ? errors.map(e => e.message).join(', ') : message
      }
    }
  )
}

const onAddAttachment = () => {
  inputRef.value?.inputRef?.click()
}

const indexRef = ref(0)
const visibleRef = ref(false)
const imgs = computed(() => {
  return attachments.value
    .filter(item => item.mime?.startsWith('image/'))
    .map(item => ({
      id: item.id,
      src: getAttachment(item.id),
      title: item.name ?? `Attachment #${item.id}`
    }))
})
const onHide = () => {
  visibleRef.value = false
}
const onShow = (item: TAttachment) => {
  const src = getAttachment(item.id)
  if (!src) return
  if (item.mime?.startsWith('application/pdf') || item.path?.endsWith('.pdf')) {
    return pdfViewer.open({
      src,
      title: item.name ?? `Attachment #${item.id}`
    })
  }
  const index = imgs.value.findIndex(v => {
    return v.id === item.id
  })
  if (index !== -1) {
    indexRef.value = index
    visibleRef.value = true
    return
  }
  window.open(src, '_blank')
}

// selected attachments
const selected = ref<number[]>([])
const onSelect = (id: number) => {
  if (selected.value.includes(id)) {
    selected.value = selected.value.filter(v => v !== id)
  } else {
    selected.value.push(id)
  }
}

const { confirm } = useConfirm()
const { mutateAsync: deleteAttachments } = useDeleteAttachmentsMutation()

const onDeleteSelected = async () => {
  if (await confirm('Are you sure you want to delete these attachments?')) {
    promiseToast(
      ({ onSuccess, onError }) => {
        return deleteAttachments(selected.value, {
          onError,
          onSuccess(res) {
            onSuccess(res)
            attachments.value = attachments.value.filter(v => {
              return !selected.value.includes(v.id)
            })
            selected.value = []
          }
        })
      },
      {
        title: 'Deleting attachments...',
        description: `Don't close this page, please wait while we delete the attachments...`
      },
      () => ({
        title: 'Attachments deleted',
        description: 'Attachments deleted successfully'
      }),
      err => {
        const { message, errors } = parseError(err)
        return {
          title: 'Failed to delete attachments',
          description: errors?.length ? errors.map(e => e.message).join(', ') : message
        }
      }
    )
  }
}
</script>

<template>
  <div class="flex items-center justify-between">
    <div class="flex-1">Attachments</div>
    <div class="flex-none flex items-center gap-1">
      <template v-if="selected.length">
        <UTooltip text="Clear selection">
          <UButton
            size="xs"
            color="error"
            variant="link"
            @click="selected = []"
          >
            Clear
          </UButton>
        </UTooltip>
        <UButton
          size="xs"
          label="Delete"
          icon="i-lucide-trash"
          color="error"
          variant="subtle"
          :ui="{ leadingIcon: 'size-3' }"
          @click="onDeleteSelected"
        >
          <template #trailing>
            <UKbd :ui="{ base: 'min-w-4 size-4 text-[10px]' }">
              {{ selected.length }}
            </UKbd>
          </template>
        </UButton>
      </template>
      <UButton
        :loading="isPending"
        icon="i-lucide-plus"
        size="xs"
        label="Add"
        @click="onAddAttachment"
      />
    </div>
  </div>
  <div class="gap-1 flex flex-col mt-2">
    <UCard
      v-for="item in attachments"
      :key="item.id"
      :ui="{ body: 'sm:p-2' }"
      variant="soft"
      class="cursor-pointer hover:bg-elevated/90 group"
      @click.stop.prevent="onShow(item)"
    >
      <div class="flex items-center gap-2">
        <div class="relative">
          <UAvatar
            size="2xl"
            class="rounded-lg"
            icon="i-lucide-file"
            :alt="item.name ?? ''"
            :src="getAttachment(item.id)"
          />
          <div
            :class="{ 'visible opacity-100': selected.includes(item.id) }"
            class="absolute inset-0 flex invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-300 items-center justify-center z-10 bg-elevated rounded-lg"
            @click.stop.prevent="onSelect(item.id)"
          >
            <UCheckbox
              variant="card"
              :model-value="selected.includes(item.id)"
              @click.stop
              @change.stop.prevent="onSelect(item.id)"
            />
          </div>
        </div>
        <div class="flex-1 overflow-hidden">
          <div class="truncate">
            {{ item.name || `Attachment #${item.id}` }}
          </div>
          <div class="flex items-center gap-1">
            <UBadge
              :label="formatBytes(item.size) || 'Unknown'"
              size="sm"
              color="neutral"
              variant="subtle"
            />
            <UBadge
              :label="item.mime || 'Unknown'"
              size="sm"
              color="neutral"
              variant="subtle"
            />
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!--  -->
        </div>
      </div>
    </UCard>
    <UInput
      ref="inputRef"
      :accept="accept"
      :multiple="multiple"
      type="file"
      class="hidden"
      @input="onInput"
    />
    <VueEasyLightbox
      :visible="visibleRef"
      :imgs="imgs"
      :index="indexRef"
      @hide="onHide"
    />
  </div>
</template>
