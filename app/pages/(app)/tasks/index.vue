<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')

const UBadge = resolveComponent('UBadge')
const TaskStatusBadge = resolveComponent('TaskStatusBadge')
const TaskDueDateBadge = resolveComponent('TaskDueDateBadge')
const TaskPriorityBadge = resolveComponent('TaskPriorityBadge')

const { data, refetch } = useTasksOverviewQuery()

const overview = computed(() => {
  return (
    data.value ?? {
      summary: {
        total: 0,
        todo: 0,
        inReview: 0,
        failed: 0,
        cancelled: 0,
        inProgress: 0,
        completed: 0,
        goalEligible: 0,
        goalHit: 0,
        goalFail: 0,
        goalHitRate: 0,
        goalFailRate: 0
      },
      weekly: {
        done: 0,
        total: 0,
        remaining: 0,
        percent: 0,
        changePercent: 0,
        volumeChangePercent: 0
      },
      monthly: {
        completed: 0,
        target: 0,
        remaining: 0,
        percent: 0,
        changePercent: 0,
        volumeChangePercent: 0
      },
      trends: {
        completedWeekOverWeek: 0,
        completedMonthOverMonth: 0
      }
    }
  )
})

const formatDelta = value => `${value >= 0 ? '+' : ''}${value}%`

const performers = [
  { name: 'Vielka Mooney', role: 'Senior Salesman', active: 42, hitRate: 115 },
  { name: 'India Oliver', role: 'Mid Salesman', active: 28, hitRate: 92 },
  { name: 'Taylor Wynn', role: 'Account Manager', active: 15, hitRate: 78 }
]

const overviewCards = computed(() => {
  const total = overview.value.summary.total
  const todo = overview.value.summary.todo
  const inReview = overview.value.summary.inReview
  const failed = overview.value.summary.failed
  const inProgress = overview.value.summary.inProgress
  const completed = overview.value.summary.completed
  const goalEligible = overview.value.summary.goalEligible
  const goalHit = overview.value.summary.goalHit
  const goalFail = overview.value.summary.goalFail
  const hitRate = overview.value.summary.goalHitRate
  const failRate = overview.value.summary.goalFailRate

  return [
    {
      key: 'total',
      title: 'Total Tasks',
      value: total.toLocaleString(),
      icon: 'i-lucide-clipboard-list',
      trend: `${formatDelta(overview.value.weekly.volumeChangePercent)} WoW`,
      tone: 'success',
      titleColor: 'secondary',
      subTitle: 'Todo',
      subTitleColor: 'neutral',
      subValue: todo.toLocaleString(),
      valueTooltip: '',
      subValueTooltip: ''
    },
    {
      key: 'progress',
      title: 'In Progress',
      value: String(inProgress),
      icon: 'i-lucide-git-branch',
      trend: `${overview.value.weekly.total} new this week`,
      tone: 'primary',
      titleColor: 'primary',
      subTitle: 'In Review',
      subTitleColor: 'warning',
      subValue: inReview.toLocaleString(),
      valueTooltip: '',
      subValueTooltip: ''
    },
    {
      key: 'done',
      title: 'Completed',
      value: String(completed),
      icon: 'i-lucide-circle-check-big',
      trend: `${formatDelta(overview.value.trends.completedWeekOverWeek)} WoW`,
      tone: 'success',
      titleColor: 'success',
      subTitle: 'Failed',
      subTitleColor: 'error',
      subValue: failed.toLocaleString(),
      valueTooltip: '',
      subValueTooltip: ''
    },
    {
      key: 'rate',
      title: 'Goal Hit Rate',
      value: `${hitRate}%`,
      icon: 'i-lucide-trophy',
      trend: `${formatDelta(overview.value.monthly.changePercent)} MoM`,
      tone: 'warning',
      titleColor: 'success',
      subTitle: 'Goal Fail Rate',
      subTitleColor: 'error',
      subValue: `${failRate}%`,
      valueTooltip: `${goalHit.toLocaleString()} of ${goalEligible.toLocaleString()} tasks completed on/before due date`,
      subValueTooltip: `${goalFail.toLocaleString()} of ${goalEligible.toLocaleString()} tasks are overdue and not completed`
    }
  ]
})

const sprintProgress = computed(() => {
  return overview.value.weekly
})

const monthlyAlignment = computed(() => {
  return overview.value.monthly
})

const formOpen = ref(false)
const initialQuery = ref<Record<string, any>>({
  perPage: 10,
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.FAILED],
  orderBy: {
    dueAt: 'asc'
  }
})

const getUsersCell = useUsersCell()

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
      h(TaskStatusBadge, {
        task: row.original
      })
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    sortBy: 'priority',
    cell: ({ row }) =>
      h(TaskPriorityBadge, {
        status: row.original.status,
        priority: row.original.priority
      })
  },
  // {
  //   accessorKey: 'statusUpdater',
  //   header: 'Status updater',
  //   sortBy: 'statusUpdaterId',
  //   cell: ({ row }) => row.original.statusUpdater?.name || '—'
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
    cell: ({ row }) =>
      h(TaskDueDateBadge, {
        dueAt: row.original.dueAt,
        status: row.original.status
      })
  },
  {
    accessorKey: 'users',
    header: 'Assignee',
    sortBy: 'users',
    display: {
      type: 'array',
      slice: 2,
      class: 'flex flex-wrap -ml-1 -mt-1'
    },
    cell({ row, ...ctx }) {
      if (!row.original.users?.length) return '—'
      return getUsersCell(
        row.original.users.map(v => v.user!),
        {
          modal: (ctx as any).modal
        }
      )
    }
  },
  {
    accessorKey: 'teams',
    header: 'Teams',
    sortBy: 'teams',
    display: {
      type: 'array',
      slice: 2,
      class: 'flex flex-wrap -ml-1 -mt-1'
    },
    cell({ row, ...ctx }) {
      if (!row.original.teams?.length) return '—'
      return getUsersCell(
        row.original.teams.map(v => v.team!),
        {
          modal: (ctx as any).modal
        }
      )
    }
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
    name: 'status',
    type: 'checkbox-api',
    props: {
      label: 'Status',
      api: '/api/tasks/statuses',
      query: {
        options: true
      }
    }
  },
  {
    name: 'priority',
    type: 'checkbox-api',
    props: {
      label: 'Priority',
      api: '/api/tasks/priorities',
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
    name: 'users',
    type: 'checkbox-api',
    props: {
      label: 'Assignee',
      api: '/api/users',
      query: {
        options: true
      }
    }
  },
  {
    name: 'teams',
    type: 'checkbox-api',
    props: {
      label: 'Teams',
      api: '/api/teams',
      query: {
        options: true
      }
    }
  }
]

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
          refetch()
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
    :initial-query="initialQuery"
    grid-class="grid grid-cols-12 gap-4"
    left-class="col-span-9"
  >
    <template #actions>
      <UButton
        trailing-icon="i-lucide-chevron-right"
        label="Manage"
        color="neutral"
        variant="subtle"
        to="/tasks/0"
      />
      <UButton
        icon="i-lucide-plus"
        label="Create Task"
        @click="formOpen = true"
      />
    </template>
    <template #top>
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard
          v-for="card in overviewCards"
          :key="card.key"
        >
          <div class="space-y-3">
            <div class="flex items-start justify-between">
              <div>
                <div
                  class="rounded-md flex items-center justify-center size-10"
                  :class="`bg-${card.titleColor}/10`"
                >
                  <UIcon
                    :name="card.icon"
                    class="size-5"
                    :class="`text-${card.titleColor}`"
                  />
                </div>
              </div>
              <UBadge
                :color="card.tone"
                variant="soft"
              >
                {{ card.trend }}
              </UBadge>
            </div>
            <div class="flex items-end gap-1">
              <div class="flex-1">
                <div
                  class="text-xs uppercase tracking-wide"
                  :class="`text-${card.titleColor}`"
                >
                  {{ card.title }}
                </div>
                <UTooltip :text="card.valueTooltip">
                  <div
                    class="text-3xl font-bold"
                    :class="`text-${card.titleColor}`"
                  >
                    {{ card.value }}
                  </div>
                </UTooltip>
              </div>
              <div class="flex-1">
                <div
                  class="text-xs uppercase tracking-wide opacity-60"
                  :class="`text-${card.subTitleColor}`"
                >
                  {{ card.subTitle }}
                </div>
                <UTooltip :text="card.subValueTooltip">
                  <div
                    class="text-2xl font-semibold opacity-60"
                    :class="`text-${card.subTitleColor}`"
                  >
                    {{ card.subValue }}
                  </div>
                </UTooltip>
              </div>
            </div>
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
