<script setup lang="ts">
import type { TColumn, TFilter, TGetActions } from '@/components/base/BaseCrud.vue'
import { TargetStatus } from '~~/prisma/client/enums'
import { getTargetFillUp } from '~~/shared/utils/targetWindows'

const crudRef = useTemplateRef('crudRef')

const UBadge = resolveComponent('UBadge')
const TaskPriorityBadge = resolveComponent('TaskPriorityBadge')
const TargetRecurrenceBadge = resolveComponent('TargetRecurrenceBadge')
const TargetStatusBadge = resolveComponent('TargetStatusBadge')
const TargetRangeBadge = resolveComponent('TargetRangeBadge')

const { data, refetch } = useTargetsOverviewQuery()
const { getAttachment } = useGetAttachment()

const overviewCards = computed(() => {
  const s = data.value.summary
  return [
    {
      icon: 'i-lucide-activity',
      color: 'primary',
      items: [
        {
          name: 'Running',
          color: 'primary',
          value: s.running.toLocaleString()
        },
        {
          name: 'Paused',
          color: 'warning',
          value: s.paused.toLocaleString()
        },
        {
          name: 'New',
          color: 'neutral',
          value: s.new.toLocaleString()
        }
      ]
    },
    {
      icon: 'i-lucide-gauge',
      color: 'success',
      items: [
        {
          name: 'Achieved this month',
          color: 'success',
          value: s.achievedMonth.toLocaleString()
        },
        {
          name: 'Avg fill-up',
          color: 'primary',
          tooltip: 'Average checklist completion for currently running targets',
          value: `${s.fillUpPercent}%`
        }
      ]
    },
    {
      icon: 'i-lucide-circle-x',
      color: 'error',
      items: [
        {
          name: 'Missed this month',
          color: 'error',
          value: s.missedMonth.toLocaleString()
        },
        {
          name: 'Skipped',
          color: 'secondary',
          value: s.skippedMonth.toLocaleString()
        }
      ]
    },
    {
      icon: 'i-lucide-trophy',
      color: 'warning',
      items: [
        {
          name: 'Hit rate',
          color: 'success',
          tooltip: `${s.achievedMonth.toLocaleString()} of ${s.hitEligible.toLocaleString()} closed cycles achieved this month (skipped/stopped/cancelled excluded)`,
          value: `${s.hitRate}%`
        },
        {
          name: 'Miss rate',
          color: 'error',
          tooltip: `${s.missedMonth.toLocaleString()} of ${s.hitEligible.toLocaleString()} closed cycles missed this month`,
          value: `${s.missRate}%`
        }
      ]
    }
  ]
})

const formOpen = ref(false)
const initialQuery = ref<Record<string, any>>({
  perPage: 10,
  status: [TargetStatus.RUNNING, TargetStatus.PAUSED],
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
    accessorKey: 'targetStatus',
    header: 'Status',
    sortBy: 'targetStatus',
    cell: ({ row }) =>
      h(TargetStatusBadge, {
        status: row.original.targetStatus
      })
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    sortBy: 'priority',
    cell: ({ row }) =>
      h(TaskPriorityBadge, {
        status:
          row.original.targetStatus === TargetStatus.ACHIEVED
            ? TaskStatus.COMPLETED
            : TaskStatus.TODO,
        priority: row.original.priority
      })
  },
  {
    accessorKey: 'dueAt',
    header: 'Range',
    sortBy: 'dueAt',
    cell: ({ row }) =>
      h(TargetRangeBadge, {
        startsAt: row.original.startsAt,
        dueAt: row.original.dueAt,
        status: row.original.targetStatus
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
        rangeStart: row.original.startsAt,
        rangeEnd: row.original.dueAt,
        intervalDays: recurrence.intervalDays,
        size: 'sm'
      })
    }
  },
  {
    accessorKey: 'items',
    header: 'Fill-up',
    cell: ({ row }) => {
      const fillUp = getTargetFillUp(row.original.items)
      if (!fillUp.totalItems) return '—'
      return h(UBadge, {
        variant: 'subtle',
        color: fillUp.isFilledUp ? 'success' : fillUp.fillUpPercent > 0 ? 'warning' : 'neutral',
        label: `${fillUp.completedItems}/${fillUp.totalItems} · ${fillUp.fillUpPercent}%`
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
      label: 'Range end'
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
          @click="() => (formOpen = true)"
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
                  <span>This Week (Sat–Thu)</span>
                  <span class="font-semibold">{{ data.weekly.percent }}%</span>
                </div>
                <UProgress :model-value="data.weekly.percent" />
                <div class="flex items-center justify-between text-xs text-muted">
                  <span
                    >{{ data.weekly.achieved }} /
                    {{ data.weekly.achieved + data.weekly.missed + data.weekly.remaining }}
                    achieved</span
                  >
                  <span>{{ data.weekly.remaining }} remaining</span>
                </div>
                <div
                  v-if="data.weekly.skipped"
                  class="text-xs text-muted"
                >
                  {{ data.weekly.skipped }} skipped
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
                    >{{ data.monthly.achieved.toLocaleString() }} /
                    {{
                      (
                        data.monthly.achieved +
                        data.monthly.missed +
                        data.monthly.remaining
                      ).toLocaleString()
                    }}
                    achieved</span
                  >
                  <span>{{ data.monthly.remaining.toLocaleString() }} remaining</span>
                </div>
                <div
                  v-if="data.monthly.skipped"
                  class="text-xs text-muted"
                >
                  {{ data.monthly.skipped }} skipped
                </div>
              </div>
            </div>
          </UCard>

          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold">Top Performers</h3>
            </template>
            <div
              v-if="!data.performers.length"
              class="text-sm text-muted py-4 text-center"
            >
              No assignee performance yet this month.
            </div>
            <div
              v-else
              class="space-y-3"
            >
              <div
                v-for="member in data.performers"
                :key="member.userId"
                class="flex items-center justify-between rounded-md border border-default p-2"
              >
                <div class="flex items-center gap-2 min-w-0">
                  <UAvatar
                    size="xs"
                    :src="getAttachment(member.avatar?.path)"
                    :alt="member.name"
                  />
                  <div class="min-w-0">
                    <p class="font-medium truncate">{{ member.name }}</p>
                    <p class="text-xs text-muted">
                      {{ member.active }} active · {{ member.achieved }}/{{ member.assigned }}
                      achieved
                    </p>
                  </div>
                </div>
                <UBadge
                  color="success"
                  variant="soft"
                  :label="`${member.hitRate}%`"
                />
              </div>
            </div>
            <UButton
              block
              variant="subtle"
              color="neutral"
              class="mt-3"
              to="/targets/leaderboard"
            >
              View Leaderboard
            </UButton>
          </UCard>
        </div>
      </template>
    </BaseCrud>
  </div>
</template>
