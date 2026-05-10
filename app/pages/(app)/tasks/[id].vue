<script setup lang="ts">
import type { TTaskItemRow } from '~/components/task/TaskItems.vue'
import type { Mail } from '~/types'
import { TaskItemStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'

definePageMeta({
  layout: 'tasks'
})

type TTaskItem = {
  id: number
  name: string
  status: TaskItemStatus
  sortOrder?: number
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
const checklistRows = ref<TTaskItemRow[]>([])
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

type TBadgeColor = 'error' | 'warning' | 'neutral' | 'success' | 'primary' | 'info' | 'secondary'

const priorityMeta: Record<TaskPriority, { label: string; color: TBadgeColor }> = {
  [TaskPriority.URGENT]: { label: 'Urgent', color: 'error' },
  [TaskPriority.HIGH]: { label: 'High', color: 'warning' },
  [TaskPriority.MEDIUM]: { label: 'Medium', color: 'neutral' },
  [TaskPriority.LOW]: { label: 'Low', color: 'success' }
}

const statusMeta: Record<TaskStatus, { label: string; color: TBadgeColor }> = {
  [TaskStatus.TODO]: { label: 'To Do', color: 'neutral' },
  [TaskStatus.IN_PROGRESS]: { label: 'In Progress', color: 'primary' },
  [TaskStatus.IN_REVIEW]: { label: 'In Review', color: 'warning' },
  [TaskStatus.COMPLETED]: { label: 'Completed', color: 'success' },
  [TaskStatus.CANCELLED]: { label: 'Cancelled', color: 'error' }
}

const { data: task, status: loadingStatus } = useFetch<TTask>(() => `/api/tasks/${taskId.value}`, {
  watch: [taskId]
})

const dueDate = ref<any>()
const descriptionDraft = ref('')

watch(
  task,
  value => {
    if (value) {
      status.value = value.status
      dueDate.value = value.dueAt
        ? calendarFormatDate(value.dueAt.toString().slice(0, 10), { returnType: 'dateValue' })
        : undefined
      descriptionDraft.value = value.description ?? ''
    }
  },
  { immediate: true }
)

watch(
  () => task.value,
  t => {
    if (!t) {
      checklistRows.value = []
      return
    }
    checklistRows.value = t.items.map(i => ({
      id: i.id,
      text: i.name,
      done: i.status === TaskItemStatus.COMPLETED
    }))
  },
  { immediate: true }
)

const itemMeta = (row: TTaskItemRow) => {
  const it = task.value?.items.find(i => i.id === row.id)
  if (!it) return undefined
  return it.completedBy?.name ? `Completed by ${it.completedBy.name}` : 'Pending peer review'
}

const onDescriptionBlur = () => {
  if (!task.value) return
  const nextTrimmed = descriptionDraft.value.trim()
  const serverTrimmed = (task.value.description ?? '').trim()
  if (nextTrimmed === serverTrimmed) return
  const payload = nextTrimmed === '' ? null : nextTrimmed
  patchTask({ description: payload }, t => {
    t.description = payload
  })
}

const onUpdateDueDate = (next?: any) => {
  if (!task.value) return
  const dueAt = next ? calendarFormatDate(next, { returnType: 'storage' }) : null
  const current = task.value.dueAt ? task.value.dueAt.toString().slice(0, 10) : null
  if ((dueAt || null) === current) return
  dueDate.value = next
  patchTask({ dueAt }, t => {
    t.dueAt = dueAt ? `${dueAt}T12:00:00.000Z` : null
  })
}

const completion = computed(() => {
  const list = task.value?.items || []
  const done = list.filter(item => item.status === TaskItemStatus.COMPLETED).length
  const total = list.length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
})

const cloneTask = (t: TTask): TTask => JSON.parse(JSON.stringify(t)) as TTask

/** Reconcile task with server without toggling useFetch pending (avoids full-page spinner). */
const reconcileTaskFromServer = async () => {
  const next = await $fetch<TTask>(`/api/tasks/${taskId.value}`)
  task.value = next
}

/** Applies optimistic UI update, then PATCH in background; silent GET reconciles with server. */
const patchTask = (body: Record<string, any>, optimistic?: (draft: TTask) => void) => {
  if (!task.value) return
  const backup = cloneTask(task.value)
  try {
    optimistic?.(task.value)
  } catch {
    return
  }

  void $fetch(`/api/tasks/${taskId.value}`, {
    method: 'PATCH',
    body
  })
    .then(async () => {
      await reconcileTaskFromServer()
    })
    .catch(e => {
      task.value = backup
      const { message } = parseError(e)
      toast.add({
        color: 'error',
        title: 'Update failed',
        description: message
      })
      void reconcileTaskFromServer().catch(() => {})
    })
}

const onStatusChange = (next: TaskStatus) => {
  if (!task.value || next === task.value.status) return
  patchTask({ status: next }, t => {
    t.status = next
  })
}

const onDetailToggle = ({ row, done }: { row: TTaskItemRow; done: boolean }) => {
  if (!task.value || row.id <= 0) return
  patchTask(
    {
      updateItems: [{ id: row.id, completed: done }]
    },
    t => {
      const r = t.items.find(i => i.id === row.id)
      if (!r) return
      r.status = done ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO
      r.completedBy = done ? (r.completedBy ?? { id: 0, name: '…' }) : null
      const todos = t.items
        .filter(i => i.status === TaskItemStatus.TODO)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      const completed = t.items
        .filter(i => i.status === TaskItemStatus.COMPLETED)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      t.items = [...todos, ...completed]
    }
  )
}

const onDetailReorder = ({ rows }: { rows: TTaskItemRow[] }) => {
  if (!task.value) return
  const todos = rows.filter(r => !r.done)
  const done = rows.filter(r => r.done)
  const updates = [
    ...todos.map((r, i) => ({ id: r.id, sortOrder: i })),
    ...done.map((r, i) => ({ id: r.id, sortOrder: i }))
  ].filter(u => u.id > 0)
  if (!updates.length) return
  patchTask({ updateItems: updates }, t => {
    const byId = new Map(t.items.map(i => [i.id, i]))
    t.items = [...todos, ...done].map(r => byId.get(r.id)).filter(Boolean) as TTaskItem[]
  })
}

const onDetailCommit = ({ row, text }: { row: TTaskItemRow; text: string }) => {
  if (!task.value) return
  const trimmed = text.trim()
  if (row.id < 0) {
    if (!trimmed) return
    patchTask({ addItems: [{ name: trimmed, checked: row.done }] }, t => {
      const item: TTaskItem = {
        id: row.id,
        name: trimmed,
        sortOrder: row.done ? undefined : 0,
        status: row.done ? TaskItemStatus.COMPLETED : TaskItemStatus.TODO,
        completedBy: row.done ? { id: 0, name: '…' } : null
      }
      const todos = t.items.filter(i => i.status === TaskItemStatus.TODO)
      const completed = t.items.filter(i => i.status === TaskItemStatus.COMPLETED)
      if (item.status === TaskItemStatus.TODO) {
        t.items = [item, ...todos, ...completed]
      } else {
        t.items = [...todos, ...completed, item]
      }
    })
    return
  }
  patchTask({ updateItems: [{ id: row.id, name: trimmed || 'Untitled' }] }, t => {
    const r = t.items.find(i => i.id === row.id)
    if (r) r.name = trimmed || 'Untitled'
  })
}

const onDetailRemove = ({ row }: { row: TTaskItemRow }) => {
  if (!task.value || row.id <= 0) return
  patchTask({ deleteItemIds: [row.id] }, t => {
    t.items = t.items.filter(i => i.id !== row.id)
  })
}

const onDetailAddRow = () => {
  checklistRows.value.unshift({ id: -Date.now(), text: '', done: false })
}

const onAssignUser = () => {
  const selected = addingUser.value?.[0]
  const selectedId = selected?.id
  if (!selectedId || !task.value) return
  const current = task.value.users.map(row => row.userId)
  addingUser.value = []
  patchTask(
    {
      userIds: Array.from(new Set([...current, selectedId]))
    },
    t => {
      if (t.users.some(u => u.userId === selectedId)) return
      t.users.push({
        id: -selectedId,
        userId: selectedId,
        user: {
          id: selectedId,
          name: selected.name ?? 'User'
        }
      })
    }
  )
}

const onRemoveUser = (userId: number) => {
  if (!task.value) return
  const nextIds = task.value.users.map(row => row.userId).filter(id => id !== userId)
  patchTask({ userIds: nextIds }, t => {
    t.users = t.users.filter(u => u.userId !== userId)
  })
}

const onAssignTeam = () => {
  const selected = addingTeam.value?.[0]
  const selectedId = selected?.id
  if (!selectedId || !task.value) return
  const current = task.value.teams.map(row => row.teamId)
  addingTeam.value = []
  patchTask(
    {
      teamIds: Array.from(new Set([...current, selectedId]))
    },
    t => {
      if (t.teams.some(x => x.teamId === selectedId)) return
      t.teams.push({
        id: -selectedId,
        teamId: selectedId,
        team: {
          id: selectedId,
          name: selected.name ?? 'Team'
        }
      })
    }
  )
}

const onRemoveTeam = (teamId: number) => {
  if (!task.value) return
  const nextIds = task.value.teams.map(row => row.teamId).filter(id => id !== teamId)
  patchTask({ teamIds: nextIds }, t => {
    t.teams = t.teams.filter(x => x.teamId !== teamId)
  })
}

const onUploadAttachment = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append('file', file)
  try {
    const attachment = await $fetch<{
      id: number
      name?: string | null
      mime?: string | null
      size?: number | null
    }>('/api/attachments', {
      method: 'POST',
      body: form
    })
    patchTask({ addAttachmentIds: [attachment.id] }, t => {
      t.attachables.push({
        id: -attachment.id,
        attachmentId: attachment.id,
        attachment: {
          id: attachment.id,
          name: attachment.name ?? file.name,
          mime: attachment.mime ?? null,
          size: attachment.size ?? null,
          createdAt: new Date().toISOString()
        }
      })
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

const onRemoveAttachment = (attachmentId: number) => {
  patchTask({ removeAttachmentIds: [attachmentId] }, t => {
    t.attachables = t.attachables.filter(a => a.attachmentId !== attachmentId)
  })
}
</script>

<template>
  <div
    v-if="task"
    class="flex flex-1"
  >
    <div class="space-y-4 flex-1 p-4">
      <div class="space-y-3">
        <UButton
          icon="i-lucide-arrow-left"
          variant="ghost"
          color="neutral"
          @click="router.push('/tasks')"
        >
          Back to task list
        </UButton>
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
          <FormDate
            v-model="dueDate"
            :show-mode="false"
            @update:model-value="onUpdateDueDate"
          >
            <template #trigger>
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded px-1 py-0.5 transition hover:bg-elevated"
              >
                <UIcon name="i-lucide-calendar" />
                Due {{ task.dueAt ? $dfc(task.dueAt) : '—' }}
              </button>
            </template>
          </FormDate>
          <span class="inline-flex items-center gap-1">
            <UIcon name="i-lucide-workflow" />
            ID {{ task.id }}
          </span>
        </div>
      </div>

      <div @focusout="onDescriptionBlur">
        <FormEditor
          v-model="descriptionDraft"
          content-type="markdown"
          placeholder="Add short task details..."
          min-height-class="min-h-32"
          border-class="border-default"
        />
      </div>

      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <span class="text-sm font-semibold uppercase text-muted">Checklist</span>
          <UButton
            size="xs"
            variant="ghost"
            icon="i-lucide-plus"
            @click="onDetailAddRow"
          >
            Add Item
          </UButton>
        </div>
        <UProgress :model-value="completion.percent" />

        <TaskItems
          v-model="checklistRows"
          variant="detail"
          :meta-text="itemMeta"
          @toggle="onDetailToggle"
          @reorder="onDetailReorder"
          @commit-text="onDetailCommit"
          @remove="onDetailRemove"
        />
      </div>
    </div>
    <div class="space-y-4 w-96 flex-none border-l border-default p-4">
      <USelect
        v-model="status"
        :items="[...statusItems]"
        size="lg"
        class="w-full"
        value-key="value"
        @update:model-value="onStatusChange"
      />
      <FormAutocomplete
        v-model="addingUser"
        api="/api/users"
        :query="{ options: true }"
        placeholder="Assign user"
        size="lg"
      />
      <FormAutocomplete
        v-model="addingTeam"
        api="/api/teams"
        :query="{ options: true }"
        placeholder="Assign team"
        class="flex-1"
      />

      <h3 class="text-sm font-semibold uppercase text-muted">Resources</h3>

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
    </div>
  </div>
  <div
    v-else-if="loadingStatus === 'pending'"
    class="flex-1 flex justify-center p-8"
  >
    <UIcon
      name="i-lucide-loader-circle"
      class="size-8 animate-spin text-primary"
    />
  </div>
  <div
    v-else
    class="flex-1 flex items-center justify-center p-4"
  >
    <UAlert
      color="warning"
      variant="subtle"
      title="Task not found"
      class="max-w-md w-full"
      description="This task does not exist in the current dataset."
    />
  </div>
</template>
