<script setup lang="ts">
import type { TTaskItemRow } from '~/components/task/TaskItems.vue'
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

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getAttachment } = useGetAttachment()

const taskId = computed(() => Number(route.params.id))
const checklistRows = ref<TTaskItemRow[]>([])
const addingUser = ref<any[]>([])
const addingTeam = ref<any[]>([])

const firstLoad = ref(true)
const task = useState<TTask>(keys.task(taskId.value).toString())

const { mutate } = useTaskPatchMutation(taskId)
const { status } = useTaskQuery(taskId, v => {
  task.value = v
  firstLoad.value = true
})

const statusItems = getTaskStatusItems(value => {
  task.value.status = value
})

const priorityItems = getTaskPriorityItems(value => {
  task.value.priority = value
})

watchDebounced(
  task,
  value => {
    if (firstLoad.value) {
      firstLoad.value = false
      return
    }
    mutate(value)
  },
  {
    deep: true,
    debounce: 1000
  }
)

const itemMeta = (row: TTaskItemRow) => {
  const it = task.value?.items.find(i => i.id === row.id)
  if (!it) return undefined
  return it.completedBy?.name ? `Completed by ${it.completedBy.name}` : 'Pending peer review'
}

const completion = computed(() => {
  const list = task.value?.items || []
  const done = list.filter(item => item.status === TaskItemStatus.COMPLETED).length
  const total = list.length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
})

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
    <div class="space-y-4 flex-1 p-8 overflow-y-auto scrollbar">
      <div class="space-y-3">
        <UButton
          icon="i-lucide-chevron-left"
          color="neutral"
          variant="link"
          label="Go Back"
          class="flex-none -ml-1 p-0"
          @click="router.push('/tasks')"
        />
        <FormContentEditable
          v-model="task.name"
          tag="h1"
          class="text-2xl font-semibold outline-none focus:ring-1 focus:ring-primary rounded-lg focus:px-4 focus:py-2 transition-all"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UDropdownMenu :items="statusItems">
            <UBadge
              :color="ColorsMap[task.status]"
              size="lg"
              variant="soft"
            >
              <UIcon name="i-lucide-check-circle" />
              {{ task.status }}
            </UBadge>
          </UDropdownMenu>
          <UDropdownMenu :items="priorityItems">
            <UBadge
              :color="ColorsMap[task.priority]"
              size="lg"
              variant="soft"
            >
              <UIcon name="i-lucide-flag" />
              {{ task.priority }}
            </UBadge>
          </UDropdownMenu>
          <FormDate
            v-model="task.dueAt"
            :mode="'single'"
            :show-mode="false"
            :min-value="todayDateValue()"
          >
            <template #trigger>
              <UBadge
                size="lg"
                variant="soft"
              >
                <UIcon name="i-lucide-calendar" />
                {{ $dfc(task.dueAt, 'dd MMM yyyy', 'NO DUE DATE') }}
              </UBadge>
            </template>
          </FormDate>
        </div>
      </div>

      <FormEditor
        :model-value="task.description || ''"
        content-type="markdown"
        placeholder="Add short task details..."
        min-height-class="min-h-32"
        border-class="border-default"
        @update:model-value="task.description = $event"
      />

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
        <!-- <UProgress :model-value="completion.percent" /> -->

        <!-- <TaskItems
          v-model="checklistRows"
          variant="detail"
          :meta-text="itemMeta"
          @toggle="onDetailToggle"
          @reorder="onDetailReorder"
          @commit-text="onDetailCommit"
          @remove="onDetailRemove"
        /> -->
      </div>
    </div>
    <div class="space-y-4 w-96 flex-none border-l border-default p-4">
      <USelect
        v-model="task.status"
        :items="statusItems"
        size="lg"
        class="w-full"
        value-key="value"
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
    v-else-if="status === 'pending'"
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
