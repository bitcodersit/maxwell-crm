<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import type { TTaskItemRow } from '~/components/task/TaskItems.vue'
import { TaskItemStatus, TaskPriority, TaskStatus } from '~~/prisma/client/enums'

type TTask = {
  id: number
  name: string
  description?: string | null
  status: TaskStatus
  priority: TaskPriority
  dueAt?: string | Date | null
  creator?: {
    id: number
    name: string
  } | null
  reviewer?: {
    id: number
    name: string
  } | null
  createdAt: string | Date
  updatedAt: string | Date
  items?: Array<{
    id: number
    name: string
    status: TaskItemStatus
  }>
}

type TTaskFormState = {
  id?: number
  title: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  reviewers: Array<{ id: number; name: string }>
  dueAt: string
  items: TTaskItemRow[]
}

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')
const toast = useToast()

const statusItems = [
  { label: 'To Do', value: TaskStatus.TODO },
  { label: 'In Progress', value: TaskStatus.IN_PROGRESS },
  { label: 'In Review', value: TaskStatus.IN_REVIEW },
  { label: 'Completed', value: TaskStatus.COMPLETED },
  { label: 'Cancelled', value: TaskStatus.CANCELLED }
]

const priorityItems = [
  { label: 'Urgent', value: TaskPriority.URGENT },
  { label: 'High', value: TaskPriority.HIGH },
  { label: 'Medium', value: TaskPriority.MEDIUM },
  { label: 'Low', value: TaskPriority.LOW }
]

const priorityColorMap: Record<TaskPriority, string> = {
  [TaskPriority.URGENT]: 'error',
  [TaskPriority.HIGH]: 'warning',
  [TaskPriority.MEDIUM]: 'neutral',
  [TaskPriority.LOW]: 'success'
}

const statusColorMap: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: 'neutral',
  [TaskStatus.IN_PROGRESS]: 'primary',
  [TaskStatus.IN_REVIEW]: 'warning',
  [TaskStatus.COMPLETED]: 'success',
  [TaskStatus.CANCELLED]: 'error'
}

const overviewTasks = ref<TTask[]>([])

const performers = [
  { name: 'Vielka Mooney', role: 'Senior Salesman', active: 42, hitRate: 115 },
  { name: 'India Oliver', role: 'Mid Salesman', active: 28, hitRate: 92 },
  { name: 'Taylor Wynn', role: 'Account Manager', active: 15, hitRate: 78 }
]

const loadOverview = async () => {
  try {
    const res = await $fetch<{ data?: TTask[] }>('/api/tasks', {
      query: {
        page: 1,
        perPage: 200
      }
    })
    overviewTasks.value = Array.isArray(res?.data) ? res.data : []
  } catch {
    overviewTasks.value = []
  }
}

onMounted(loadOverview)

const overviewCards = computed(() => {
  const total = overviewTasks.value.length
  const inProgress = overviewTasks.value.filter(
    task => task.status === TaskStatus.IN_PROGRESS
  ).length
  const completed = overviewTasks.value.filter(task => task.status === TaskStatus.COMPLETED).length
  const hitRate = total ? Math.round((completed / total) * 100) : 0

  return [
    {
      key: 'total',
      title: 'Total Tasks',
      value: total.toLocaleString(),
      icon: 'i-lucide-clipboard-list',
      trend: `${Math.max(total, 0)}`,
      tone: 'success' as const
    },
    {
      key: 'progress',
      title: 'In Progress',
      value: String(inProgress),
      icon: 'i-lucide-git-branch',
      trend: 'In Flow',
      tone: 'primary' as const
    },
    {
      key: 'done',
      title: 'Completed',
      value: String(completed),
      icon: 'i-lucide-circle-check-big',
      trend: `${hitRate}%`,
      tone: 'success' as const
    },
    {
      key: 'rate',
      title: 'Goal Hit Rate',
      value: `${hitRate}%`,
      icon: 'i-lucide-trophy',
      trend: 'Target Hit',
      tone: 'warning' as const
    }
  ]
})

const sprintProgress = computed(() => {
  const total = overviewTasks.value.length
  const done = overviewTasks.value.filter(task => task.status === TaskStatus.COMPLETED).length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
})

const monthlyAlignment = computed(() => {
  const target = overviewTasks.value.length * 100
  const completed =
    overviewTasks.value.filter(task => task.status === TaskStatus.COMPLETED).length * 100
  const percent = target ? Math.round((completed / target) * 100) : 0
  return { completed, target, percent }
})

const columns = computed<TColumn<TTask>[]>(() => [
  {
    id: 'select',
    size: 48
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name',
    display: {
      type: 'text',
      class: 'w-64',
      length: 40
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    sortBy: 'status',
    cell: ({ row }) =>
      h(UBadge, {
        label:
          statusItems.find(item => item.value === row.original.status)?.label ||
          row.original.status,
        color: statusColorMap[row.original.status],
        variant: 'subtle'
      })
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    sortBy: 'priority',
    cell: ({ row }) =>
      h(UBadge, {
        label:
          priorityItems.find(item => item.value === row.original.priority)?.label ||
          row.original.priority,
        color: priorityColorMap[row.original.priority],
        variant: 'subtle'
      })
  },
  // {
  //   accessorKey: 'reviewer',
  //   header: 'Reviewer',
  //   sortBy: 'reviewerId',
  //   cell: ({ row }) => row.original.reviewer?.name || '—'
  // },
  // {
  //   accessorKey: 'creator',
  //   header: 'Creator',
  //   sortBy: 'creatorId',
  //   cell: ({ row }) => row.original.creator?.name || '—'
  // },
  {
    accessorKey: 'dueAt',
    header: 'Due',
    sortBy: 'dueAt',
    cell: ({ row }) => (row.original.dueAt ? $dfc(row.original.dueAt) : '—')
  },
  // {
  //   accessorKey: 'createdAt',
  //   header: 'Created',
  //   sortBy: 'createdAt',
  //   cell: ({ row }) => $dfc(row.original.createdAt)
  // },
  // {
  //   accessorKey: 'updatedAt',
  //   header: 'Updated',
  //   sortBy: 'updatedAt',
  //   cell: ({ row }) => $dfc(row.original.updatedAt)
  // },
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters: TFilter[] = [
  {
    name: 'q',
    type: 'inline-input',
    props: {
      placeholder: 'Search...'
    }
  },
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10'
    }
  },
  {
    name: 'name',
    type: 'input',
    props: {
      label: 'Name',
      placeholder: 'Search by task name',
      modeable: true
    }
  },
  {
    name: 'status',
    type: 'input',
    props: {
      label: 'Status',
      placeholder: 'Filter by status',
      modeable: true
    }
  },
  {
    name: 'priority',
    type: 'input',
    props: {
      label: 'Priority',
      placeholder: 'Filter by priority',
      modeable: true
    }
  },
  {
    name: 'creatorId',
    type: 'checkbox-api',
    props: {
      label: 'Creator',
      api: '/api/users',
      query: {
        options: true
      }
    }
  },
  {
    name: 'reviewerId',
    type: 'checkbox-api',
    props: {
      label: 'Reviewer',
      api: '/api/users',
      query: {
        options: true
      }
    }
  },
  {
    name: 'dueAt',
    type: 'date',
    props: {
      label: 'Due date'
    }
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created'
    }
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated'
    }
  }
]

const formOpen = ref(false)
const formMode = ref<'create' | 'update'>('create')
const formState = reactive<TTaskFormState>({
  title: '',
  description: '',
  status: TaskStatus.TODO,
  priority: TaskPriority.MEDIUM,
  reviewers: [],
  dueAt: '',
  items: []
})
const isSubmitting = ref(false)

const createMilestone = (text = '', done = false): TTaskItemRow => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  text,
  done
})

const rowsFromApi = (
  items: Array<{ id: number; name: string; status: TaskItemStatus }>
): TTaskItemRow[] =>
  items.map(i => ({
    id: i.id,
    text: i.name,
    done: i.status === TaskItemStatus.COMPLETED
  }))

const refreshModalTaskItems = async () => {
  if (!formState.id) return
  try {
    const t = await $fetch<{
      items: Array<{ id: number; name: string; status: TaskItemStatus }>
    }>(`/api/tasks/${formState.id}`)
    formState.items = t.items?.length ? rowsFromApi(t.items) : [createMilestone('')]
  } catch {
    /* ignore */
  }
}

const patchEditModalItems = (body: Record<string, unknown>) => {
  if (formMode.value !== 'update' || !formState.id) return

  void $fetch(`/api/tasks/${formState.id}`, {
    method: 'PATCH',
    body
  })
    .then(() => refreshModalTaskItems())
    .catch(e => {
      const { message } = parseError(e)
      toast.add({
        color: 'error',
        title: 'Checklist update failed',
        description: message
      })
      void refreshModalTaskItems()
    })
}

const onModalItemsToggle = ({ row, done }: { row: TTaskItemRow; done: boolean }) => {
  if (row.id <= 0) return
  patchEditModalItems({
    updateItems: [{ id: row.id, completed: done }]
  })
}

const onModalItemsReorder = ({ rows }: { rows: TTaskItemRow[] }) => {
  const todos = rows.filter(r => !r.done)
  const done = rows.filter(r => r.done)
  const updates = [
    ...todos.map((r, i) => ({ id: r.id, sortOrder: i })),
    ...done.map((r, i) => ({ id: r.id, sortOrder: i }))
  ].filter(u => u.id > 0)
  if (!updates.length) return
  patchEditModalItems({ updateItems: updates })
}

const onModalItemsCommit = ({ row, text }: { row: TTaskItemRow; text: string }) => {
  const trimmed = text.trim()
  if (row.id < 0) {
    if (!trimmed || formMode.value !== 'update' || !formState.id) return
    patchEditModalItems({
      addItems: [{ name: trimmed, checked: row.done }]
    })
    return
  }
  if (formMode.value !== 'update' || !formState.id) return
  patchEditModalItems({
    updateItems: [{ id: row.id, name: trimmed || 'Untitled' }]
  })
}

const onModalItemsRemove = ({ row }: { row: TTaskItemRow }) => {
  if (row.id <= 0) return
  patchEditModalItems({ deleteItemIds: [row.id] })
}

const resetForm = () => {
  formState.id = undefined
  formState.title = ''
  formState.description = ''
  formState.status = TaskStatus.TODO
  formState.priority = TaskPriority.MEDIUM
  formState.reviewers = []
  formState.dueAt = ''
  formState.items = [createMilestone('')]
}

const openCreate = () => {
  formMode.value = 'create'
  resetForm()
  formOpen.value = true
}

const openUpdate = (task: TTask) => {
  formMode.value = 'update'
  formState.id = task.id
  formState.title = task.name
  formState.description = task.description || ''
  formState.status = task.status
  formState.priority = task.priority
  formState.reviewers = task.reviewer ? [task.reviewer] : []
  formState.dueAt = task.dueAt ? new Date(task.dueAt).toISOString().slice(0, 10) : ''
  formState.items = task.items?.length ? rowsFromApi(task.items) : [createMilestone('')]
  formOpen.value = true
}

const onAddMilestone = () => {
  formState.items.unshift(createMilestone(''))
}

const onSubmitTask = async () => {
  const title = formState.title.trim()
  const description = formState.description.trim()
  if (!title || !description) {
    toast.add({
      color: 'error',
      title: 'Missing fields',
      description: 'Please add title and description.'
    })
    return
  }

  isSubmitting.value = true
  try {
    if (formMode.value === 'create') {
      const created = await $fetch<{ id: number }>('/api/tasks', {
        method: 'POST',
        body: {
          name: title,
          description,
          items: formState.items
            .map(v => ({
              name: v.text.trim(),
              checked: v.done
            }))
            .filter(item => item.name)
        }
      })
      toast.add({
        color: 'success',
        title: 'Success',
        description: 'Task added successfully'
      })
      formOpen.value = false
      resetForm()
      await navigateTo(`/tasks/${created.id}`)
      return
    }

    await $fetch(`/api/tasks/${formState.id}`, {
      method: 'PATCH',
      body: {
        name: title,
        description,
        status: formState.status,
        priority: formState.priority,
        reviewerId: formState.reviewers[0]?.id || null,
        dueAt: formState.dueAt || null
      }
    })
    toast.add({
      color: 'success',
      title: 'Success',
      description: 'Task updated successfully'
    })
    formOpen.value = false
    crudRef.value?.refresh()
    loadOverview()
    resetForm()
  } catch (e) {
    const { message } = parseError(e)
    toast.add({
      color: 'error',
      title: 'Failed',
      description: message
    })
  } finally {
    isSubmitting.value = false
  }
}

const router = useRouter()
const getActions: TGetActions<TTask> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        router.push(`/tasks/${item.id}`)
        // crudRef.value?.onView(item, {
        //   modal: {
        //     ui: {
        //       content: 'max-w-2xl'
        //     }
        //   }
        // })
      }
    },
    {
      ...actions.update,
      onSelect() {
        openUpdate(item)
      }
    }
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
        setTimeout(() => {
          loadOverview()
        }, 300)
      }
    }
  ]
]
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/tasks"
    delete-url="/api/tasks/{id}"
    :filters="filters"
    :columns="columns"
    :date-fields="['dueAt', 'createdAt', 'updatedAt']"
    :get-actions="getActions"
    grid-class="grid grid-cols-12 gap-4"
    left-class="col-span-9"
  >
    <template #actions>
      <UButton
        icon="i-lucide-plus"
        @click="openCreate"
      >
        Create Task
      </UButton>
    </template>
    <template #top>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard
          v-for="card in overviewCards"
          :key="card.key"
          class="border-primary/20"
        >
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="rounded-md bg-primary/10 p-2">
                <UIcon
                  :name="card.icon"
                  class="size-5 text-primary"
                />
              </div>
              <UBadge
                :color="card.tone"
                variant="soft"
              >
                {{ card.trend }}
              </UBadge>
            </div>
            <div class="text-xs uppercase tracking-wide text-muted">{{ card.title }}</div>
            <div class="text-3xl font-bold">{{ card.value }}</div>
          </div>
        </UCard>
      </div>
    </template>
    <template #right>
      <div class="space-y-4 col-span-3">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Goal Performance</h3>
          </template>
          <div class="space-y-5">
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span>Weekly Sprint Progress</span>
                <span class="font-semibold">{{ sprintProgress.percent }}%</span>
              </div>
              <UProgress :model-value="sprintProgress.percent" />
              <div class="flex items-center justify-between text-xs text-muted">
                <span>{{ sprintProgress.done }} completed</span>
                <span>{{ Math.max(sprintProgress.total - sprintProgress.done, 0) }} remaining</span>
              </div>
            </div>
            <div class="space-y-1">
              <div class="flex items-center justify-between text-sm">
                <span>Monthly Quota Alignment</span>
                <span class="font-semibold">{{ monthlyAlignment.percent }}%</span>
              </div>
              <UProgress
                :model-value="monthlyAlignment.percent"
                color="warning"
              />
              <div class="flex items-center justify-between text-xs text-muted">
                <span>{{ monthlyAlignment.completed.toLocaleString() }} completed</span>
                <span>
                  {{
                    Math.max(
                      monthlyAlignment.target - monthlyAlignment.completed,
                      0
                    ).toLocaleString()
                  }}
                  remaining
                </span>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">Top Performers</h3>
          </template>
          <div class="space-y-3">
            <div
              v-for="member in performers"
              :key="member.name"
              class="flex items-center justify-between rounded-md border border-default p-2"
            >
              <div>
                <p class="font-medium">{{ member.name }}</p>
                <p class="text-xs text-muted">{{ member.role }} · {{ member.active }} active</p>
              </div>
              <UBadge
                color="success"
                variant="soft"
                :label="`${member.hitRate}%`"
              />
            </div>
            <UButton
              block
              variant="subtle"
              color="neutral"
            >
              View Leaderboard
            </UButton>
          </div>
        </UCard>
      </div>
    </template>
  </BaseCrud>

  <UModal
    v-model:open="formOpen"
    :ui="{ content: 'max-w-5xl' }"
  >
    <template #content="{ close }">
      <div class="grid grid-cols-12 overflow-hidden">
        <div class="border-r border-default/80 p-8 space-y-8 col-span-4 bg-elevated/30">
          <div class="inline-flex rounded-lg bg-primary/15 p-3">
            <UIcon
              name="i-lucide-badge-plus"
              class="size-6 text-primary"
            />
          </div>
          <div>
            <h4 class="text-2xl font-semibold">
              {{ formMode === 'create' ? 'New Task Initiation' : 'Update Task Directive' }}
            </h4>
            <p class="mt-2 text-sm text-muted">
              Complete the configuration for this CRM directive. Ensure items are clearly defined
              for the assigned team.
            </p>
          </div>
          <div class="space-y-4 text-sm">
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-shield-check"
                class="mt-0.5 size-5 text-primary"
              />
              <p>
                <span class="font-medium text-default">Precision Control</span><br />
                <span class="text-muted"
                  >Every task is tracked with millisecond-accurate logs.</span
                >
              </p>
            </div>
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-network"
                class="mt-0.5 size-4 text-primary"
              />
              <p>
                <span class="font-medium text-default">Smart Assignment</span><br />
                <span class="text-muted">Team capacity is calculated for optimal delivery.</span>
              </p>
            </div>
          </div>
        </div>
        <div class="space-y-4 p-8 col-span-8 overflow-y-auto">
          <div class="flex items-center justify-between">
            <div class="uppercase text-muted">Task Configuration</div>
            <div>
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                @click="close"
              />
            </div>
          </div>
          <UFormField
            required
            label="Name"
          >
            <UInput
              v-model="formState.title"
              size="lg"
              class="w-full"
              placeholder="Enter task name..."
            />
          </UFormField>
          <UFormField label="Description">
            <FormEditor
              v-model="formState.description"
              content-type="markdown"
              placeholder="Add short task details..."
              min-height-class="min-h-32"
            />
          </UFormField>
          <UFormField>
            <template #label>
              <div class="flex items-center justify-between gap-2">
                <span>Checklist</span>
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-plus"
                  @click="onAddMilestone"
                >
                  Add Item
                </UButton>
              </div>
            </template>
            <TaskItems
              v-model="formState.items"
              variant="form"
              keep-at-least-one-row
              @toggle="onModalItemsToggle"
              @reorder="onModalItemsReorder"
              @commit-text="onModalItemsCommit"
              @remove="onModalItemsRemove"
            />
          </UFormField>
          <div class="flex w-full justify-end gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              @click="formOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              icon="i-lucide-rocket"
              :loading="isSubmitting"
              @click="onSubmitTask"
            >
              {{ formMode === 'create' ? 'Create Task' : 'Update Task' }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
