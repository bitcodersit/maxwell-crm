<script setup lang="ts">
import { TaskItemStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'

type TTaskItem = {
  id: number
  name: string
  status: TaskItemStatus
  completedBy?: {
    id: number
    name: string
  } | null
}

type TTask = {
  id: number
  name: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueAt?: string | null
  creator?: {
    id: number
    name: string
  } | null
  reviewer?: {
    id: number
    name: string
  } | null
  users: Array<{
    id: number
    userId: number
    user: {
      id: number
      name: string
    }
  }>
  teams: Array<{
    id: number
    teamId: number
    team: {
      id: number
      name: string
    }
  }>
  items: TTaskItem[]
  attachables: Array<{
    id: number
    attachmentId: number
    attachment: {
      id: number
      name?: string | null
      mime?: string | null
      size?: number | null
      createdAt: string
    }
  }>
}

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getAttachment } = useGetAttachment()

const taskId = computed(() => Number(route.params.id))
const checklistDraft = ref('')
const addingUser = ref<any[]>([])
const addingTeam = ref<any[]>([])
const status = ref<TaskStatus>(TaskStatus.TODO)

const statusItems = [
  { label: 'To Do', value: TaskStatus.TODO },
  { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
  { label: 'In Review', value: TaskStatus.IN_REVIEW },
  { label: 'Completed', value: TaskStatus.COMPLETED },
  { label: 'Cancelled', value: TaskStatus.CANCELLED }
]

const priorityMeta: Record<TaskPriority, { label: string; color: string }> = {
  [TaskPriority.URGENT]: { label: 'Urgent', color: 'error' },
  [TaskPriority.HIGH]: { label: 'High', color: 'warning' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'neutral' },
  [TaskPriority.LOW]: { label: 'Low', color: 'success' }
}

const statusMeta: Record<TaskStatus, { label: string; color: string }> = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'neutral' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'primary' },
  [TaskStatus.IN_REVIEW]: { label: 'In Review', color: 'warning' },
  [TaskStatus.COMPLETED]: { label: 'Completed', color: 'success' },
  [TaskStatus.CANCELLED]: { label: 'Cancelled', color: 'error' }
}

const {
  data: task,
  status: loadingStatus,
  refresh
} = useFetch<TTask>(() => `/api/tasks/${taskId.value}`, {
  server: false,
  watch: [taskId]
})

watch(
  task,
  value => {
    if (value) status.value = value.status
  },
  { immediate: true }
)

const completion = computed(() => {
  const list = task.value?.items || []
  const done = list.filter(item => item.status === TaskItemStatus.COMPLETED).length
  const total = list.length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
})

const patchTask = async (body: Record<string, any>) => {
  await $fetch(`/api/tasks/${taskId.value}`, {
    method: 'PATCH',
    body
  })
  await refresh()
}

const onUpdateStatus = async () => {
  if (!task.value) return
  await patchTask({ status: status.value })
}

const onToggleMilestone = async (item: TTaskItem) => {
  await patchTask({
    updateItems: [
      {
        id: item.id,
        completed: item.status !== TaskItemStatus.COMPLETED
      }
    ]
  })
}

const onDeleteMilestone = async (itemId: number) => {
  await patchTask({
    deleteItemIds: [itemId]
  })
}

const onAddChecklist = async () => {
  if (!task.value || !checklistDraft.value.trim()) return
  await patchTask({
    addItems: [{ name: checklistDraft.value.trim() }]
  })
  checklistDraft.value = ''
}

const onAssignUser = async () => {
  const selectedId = addingUser.value?.[0]?.id
  if (!selectedId || !task.value) return
  const current = task.value.users.map(row => row.userId)
  await patchTask({
    userIds: Array.from(new Set([...current, selectedId]))
  })
  addingUser.value = []
}

const onRemoveUser = async (userId: number) => {
  if (!task.value) return
  await patchTask({
    userIds: task.value.users.map(row => row.userId).filter(id => id !== userId)
  })
}

const onAssignTeam = async () => {
  const selectedId = addingTeam.value?.[0]?.id
  if (!selectedId || !task.value) return
  const current = task.value.teams.map(row => row.teamId)
  await patchTask({
    teamIds: Array.from(new Set([...current, selectedId]))
  })
  addingTeam.value = []
}

const onRemoveTeam = async (teamId: number) => {
  if (!task.value) return
  await patchTask({
    teamIds: task.value.teams.map(row => row.teamId).filter(id => id !== teamId)
  })
}

const onUploadAttachment = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const attachment = await $fetch<{ id: number }>('/api/attachments', {
      method: 'POST',
      body: form
    })
    await patchTask({
      addAttachmentIds: [attachment.id]
    })
    toast.add({
      color: 'success',
      title: 'Attachment uploaded'
    })
  } catch (e) {
    const { message } = parseError(e)
    toast.add({
      color: 'error',
      title: 'Upload failed',
      description: message
    })
  } finally {
    input.value = ''
  }
}

const onRemoveAttachment = async (attachmentId: number) => {
  await patchTask({
    removeAttachmentIds: [attachmentId]
  })
}
</script>

<template>
  <div
    v-if="task && loadingStatus !== 'pending'"
    class="space-y-4"
  >
    <div class="flex items-center justify-between">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        @click="router.push('/tasks')"
      >
        Back to task list
      </UButton>
      <UBadge
        color="neutral"
        variant="soft"
      >
        #TASK-{{ task.id }}
      </UBadge>
    </div>

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div class="space-y-4">
        <UCard>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                :color="statusMeta[task.status].color"
                variant="subtle"
              >
                {{ statusMeta[task.status].label }}
              </UBadge>
              <UBadge
                :color="priorityMeta[task.priority].color"
                variant="soft"
              >
                {{ priorityMeta[task.priority].label }} Priority
              </UBadge>
            </div>
            <h1 class="text-2xl font-semibold">{{ task.name }}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-calendar" />
                Due {{ task.dueAt ? $dfc(task.dueAt) : '—' }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-workflow" />
                ID {{ task.id }}
              </span>
            </div>
          </div>
        </UCard>

        <UCard>
          <div
            v-if="task.description"
            class="space-y-4 text-sm leading-6 text-toned mb-6"
          >
            <p>{{ task.description || 'No description' }}</p>
          </div>

          <div class="space-y-3">
            <UProgress :model-value="completion.percent" />

            <div class="space-y-2">
              <div
                v-for="milestone in task.items"
                :key="milestone.id"
                class="flex items-start gap-2 rounded-md border border-default p-3"
              >
                <UCheckbox
                  :model-value="milestone.status === TaskItemStatus.COMPLETED"
                  @update:model-value="onToggleMilestone(milestone)"
                />
                <div class="min-w-0">
                  <p
                    class="font-medium"
                    :class="
                      milestone.status === TaskItemStatus.COMPLETED ? 'line-through text-muted' : ''
                    "
                  >
                    {{ milestone.name }}
                  </p>
                  <p class="text-xs text-muted">
                    {{
                      milestone.completedBy?.name
                        ? `Completed by ${milestone.completedBy.name}`
                        : 'Pending peer review'
                    }}
                  </p>
                </div>
                <UButton
                  icon="i-lucide-trash"
                  color="error"
                  variant="ghost"
                  @click="onDeleteMilestone(milestone.id)"
                />
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UInput
                v-model="checklistDraft"
                placeholder="Add checklist item"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-plus"
                variant="subtle"
                @click="onAddChecklist"
              >
                Add
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Task Status</h3>
          </template>
          <div class="space-y-3">
            <USelect
              v-model="status"
              :items="[...statusItems]"
              value-key="value"
            />
            <UButton
              block
              icon="i-lucide-save"
              @click="onUpdateStatus"
            >
              Update Status
            </UButton>
            <UBadge
              :color="statusMeta[task.status].color"
              variant="soft"
            >
              {{ statusMeta[task.status].label }}
            </UBadge>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Ownership</h3>
          </template>
          <div class="space-y-2 text-sm">
            <p><span class="text-muted">Creator:</span> {{ task.creator?.name || '—' }}</p>
            <p><span class="text-muted">Reviewer:</span> {{ task.reviewer?.name || '—' }}</p>
            <div class="space-y-2">
              <div
                v-for="assigned in task.users"
                :key="assigned.id"
                class="flex items-center justify-between rounded-md border border-default p-2"
              >
                <span>{{ assigned.user.name }}</span>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="onRemoveUser(assigned.userId)"
                />
              </div>
              <div class="flex items-center gap-2">
                <FormAutocomplete
                  v-model="addingUser"
                  api="/api/users"
                  :query="{ options: true }"
                  placeholder="Assign user"
                  class="flex-1"
                />
                <UButton
                  icon="i-lucide-plus"
                  variant="subtle"
                  @click="onAssignUser"
                />
              </div>
            </div>
            <div class="space-y-2 pt-2">
              <div
                v-for="assigned in task.teams"
                :key="assigned.id"
                class="flex items-center justify-between rounded-md border border-default p-2"
              >
                <span>{{ assigned.team.name }}</span>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="onRemoveTeam(assigned.teamId)"
                />
              </div>
              <div class="flex items-center gap-2">
                <FormAutocomplete
                  v-model="addingTeam"
                  api="/api/teams"
                  :query="{ options: true }"
                  placeholder="Assign team"
                  class="flex-1"
                />
                <UButton
                  icon="i-lucide-plus"
                  variant="subtle"
                  @click="onAssignTeam"
                />
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Resources</h3>
          </template>
          <div class="space-y-2">
            <template v-if="task.attachables.length">
              <div
                v-for="resource in task.attachables"
                :key="resource.id"
                class="flex items-center justify-between rounded-md border border-default p-2"
              >
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-paperclip" />
                  <div>
                    <a
                      :href="getAttachment(resource.attachment.id)"
                      target="_blank"
                      class="text-sm font-medium underline"
                    >
                      {{ resource.attachment.name || `Attachment #${resource.attachment.id}` }}
                    </a>
                    <p class="text-xs text-muted">
                      {{ resource.attachment.size ? `${resource.attachment.size} bytes` : '' }}
                    </p>
                  </div>
                </div>
                <UButton
                  icon="i-lucide-x"
                  color="error"
                  variant="ghost"
                  @click="onRemoveAttachment(resource.attachmentId)"
                />
              </div>
            </template>
            <template v-else>
              <UAlert
                color="neutral"
                variant="subtle"
                title="No files yet"
                description="Upload related documents here."
              />
            </template>
            <UInput
              type="file"
              @change="onUploadAttachment"
            />
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <UCard
    v-else
    class="max-w-xl"
  >
    <UAlert
      color="warning"
      variant="subtle"
      title="Task not found"
      description="This task does not exist in the current dummy dataset."
    />
    <template #footer>
      <UButton
        icon="i-lucide-arrow-left"
        variant="subtle"
        @click="router.push('/tasks')"
      >
        Back to tasks
      </UButton>
    </template>
  </UCard>
</template>
