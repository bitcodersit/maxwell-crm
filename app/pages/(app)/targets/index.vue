<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')

const UBadge = resolveComponent('UBadge')
const TaskStatusBadge = resolveComponent('TaskStatusBadge')
const TaskDueDateBadge = resolveComponent('TaskDueDateBadge')
const TaskPriorityBadge = resolveComponent('TaskPriorityBadge')
const TargetRecurrenceBadge = resolveComponent('TargetRecurrenceBadge')

const { data, refetch } = useTargetsOverviewQuery()

const performers = [
  { name: 'Vielka Mooney', role: 'Senior Salesman', active: 42, hitRate: 115 },
  { name: 'India Oliver', role: 'Mid Salesman', active: 28, hitRate: 92 },
  { name: 'Taylor Wynn', role: 'Account Manager', active: 15, hitRate: 78 }
]

const overviewCards = computed(() => {
  return [
    {
      icon: 'i-lucide-clipboard-list',
      color: 'secondary',
      items: [
        {
          name: 'Total Targets',
          color: 'secondary',
          value: data.value.summary.total.toLocaleString()
        },
        {
          name: 'Todo',
          color: 'neutral',
          value: data.value.summary.todo.toLocaleString()
        }
      ]
    },
    {
      icon: 'i-lucide-git-branch',
      color: 'primary',
      items: [
        {
          name: 'In Progress',
          color: 'primary',
          value: data.value.summary.inProgress.toLocaleString()
        },
        {
          name: 'In Review',
          color: 'warning',
          value: data.value.summary.inReview.toLocaleString()
        }
      ]
    },
    {
      icon: 'i-lucide-circle-check-big',
      color: 'success',
      items: [
        {
          name: 'Completed',
          color: 'success',
          value: data.value.summary.completed.toLocaleString()
        },
        {
          name: 'Failed',
          color: 'error',
          value: data.value.summary.failed.toLocaleString()
        },
        {
          name: 'Cancelled',
          color: 'error',
          value: data.value.summary.cancelled.toLocaleString()
        }
      ]
    },
    {
      icon: 'i-lucide-trophy',
      color: 'warning',
      items: [
        {
          name: 'Success Rate',
          color: 'success',
          tooltip: `${data.value.summary.goalHit.toLocaleString()} of ${data.value.summary.goalEligible.toLocaleString()} targets completed on/before due date`,
          value: `${data.value.summary.goalHitRate}%`
        },
        {
          name: 'Failure Rate',
          color: 'error',
          tooltip: `${data.value.summary.goalFail.toLocaleString()} of ${data.value.summary.goalEligible.toLocaleString()} targets are overdue and not completed`,
          value: `${data.value.summary.goalFailRate}%`
        }
      ]
    }
  ]
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
    accessorKey: 'parent',
    header: 'Recurrence',
    cell: ({ row }) => {
      const recurrence = row.original.parent?.recurrence
      if (!recurrence) return '—'
      return h(TargetRecurrenceBadge, {
        frequency: recurrence.frequency,
        rangeEnd: row.original.dueAt,
        intervalDays: recurrence.intervalDays,
        size: 'sm'
      })
    }
  },
  {
    accessorKey: 'users',
    header: 'Assignee',
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
      api: '/api/targets/statuses',
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
      api: '/api/targets/priorities',
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
        navigateTo(`/targets/${item.id}`)
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
  <TargetFormModal v-model:open="formOpen" />
  <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
    <BaseCrud
      ref="crudRef"
      get-url="/api/targets"
      delete-url="/api/targets/{id}"
      :filters="filters"
      :columns="columns"
      :get-actions="getActions"
      :initial-query="initialQuery"
      grid-class="grid grid-cols-12 gap-4 min-h-0"
      left-class="col-span-9 min-h-0"
      right-class="col-span-3 min-h-0"
    >
      <template #actions>
        <UButton
          trailing-icon="i-lucide-chevron-right"
          label="Manage"
          color="neutral"
          variant="subtle"
          to="/targets/0"
        />
        <UButton
          icon="i-lucide-plus"
          label="Create Target"
          @click="formOpen = true"
        />
      </template>
      <template #top>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <UCard
            v-for="card in overviewCards"
            :key="card.icon"
          >
            <div class="space-y-3">
              <div class="flex items-start justify-between">
                <div>
                  <div
                    class="rounded-md flex items-center justify-center size-10"
                    :class="`bg-${card.color}/10`"
                  >
                    <UIcon
                      :name="card.icon"
                      class="size-5"
                      :class="`text-${card.color}`"
                    />
                  </div>
                </div>
                <!-- <UBadge
                v-if="card.trend"
                :color="card.tone"
                variant="soft"
              >
                {{ card.trend }}
              </UBadge> -->
              </div>
              <div class="flex items-end gap-1">
                <div
                  v-for="(item, index) in card.items"
                  :key="item.name"
                  class="flex-1"
                >
                  <div
                    class="text-xs uppercase tracking-wide"
                    :class="[
                      `text-${item.color}`,
                      {
                        'opacity-60': !!index
                      }
                    ]"
                  >
                    {{ item.name }}
                  </div>
                  <UTooltip :text="item.tooltip">
                    <div
                      :class="[
                        `text-${item.color}`,
                        {
                          'text-3xl font-bold': !index,
                          'text-2xl font-semibold opacity-60': !!index
                        }
                      ]"
                    >
                      {{ item.value }}
                    </div>
                  </UTooltip>
                </div>
              </div>
            </div>
          </UCard>
        </div>
      </template>
      <template #right>
        <div class="space-y-4">
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Goal Performance</h3>
            </template>
            <div class="space-y-5">
              <div class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span>This Week</span>
                  <span class="font-semibold">{{ data.weekly.percent }}%</span>
                </div>
                <UProgress :model-value="data.weekly.percent" />
                <div class="flex items-center justify-between text-xs text-muted">
                  <span>{{ data.weekly.done }} / {{ data.weekly.total }} completed</span>
                  <span>{{ Math.max(data.weekly.total - data.weekly.done, 0) }} remaining</span>
                </div>
              </div>
              <div class="space-y-1">
                <div class="flex items-center justify-between text-sm">
                  <span>This Month</span>
                  <span class="font-semibold">{{ data.monthly.percent }}%</span>
                </div>
                <UProgress
                  :model-value="data.monthly.percent"
                  color="warning"
                />
                <div class="flex items-center justify-between text-xs text-muted">
                  <span
                    >{{ data.monthly.completed.toLocaleString() }} /
                    {{ data.monthly.target.toLocaleString() }} completed</span
                  >
                  <span>
                    {{ Math.max(data.monthly.target - data.monthly.completed, 0).toLocaleString() }}
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
  </div>
</template>
