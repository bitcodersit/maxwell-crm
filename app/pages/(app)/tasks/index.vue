<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import { TaskPriority, TaskStatus } from '~~/prisma/client/enums'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')

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

const getActions: TGetActions<TTask> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        navigateTo(`/tasks/${item.id}`)
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
  <TaskFormModal v-model:open="formOpen" />
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
        @click="formOpen = true"
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
</template>
