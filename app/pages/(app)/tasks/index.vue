<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable'

type TaskFilter = 'all' | 'critical'
type TCreateMilestone = {
  id: string
  text: string
  done: boolean
}

const { tasks, metrics, performers, statusMeta, priorityMeta, createTask } = useTasksDemo()

const q = ref('')
const filter = ref<TaskFilter>('all')
const createOpen = ref(false)
let milestoneSeed = 0
const milestonesListRef = useTemplateRef<HTMLElement>('milestonesListRef')

const createMilestone = (text = '', done = false): TCreateMilestone => ({
  id: `milestone-${Date.now()}-${milestoneSeed++}`,
  text,
  done
})

const createState = reactive({
  title: '',
  description: '',
  assignee: '',
  goalCycle: 'weekly' as const,
  milestones: [
    createMilestone('Initial client outreach and qualification'),
    createMilestone('')
  ] as TCreateMilestone[]
})

const milestonesModel = computed({
  get: () => createState.milestones,
  set: (value: TCreateMilestone[]) => {
    createState.milestones = value
  }
})

useSortable(milestonesListRef, milestonesModel, {
  animation: 300,
  watchElement: true,
  handle: '.milestone-handle'
})

// option('animation', 300)

const overviewCards = computed(() => [
  {
    key: 'total',
    title: 'Total Tasks',
    value: metrics.value.total.toLocaleString(),
    icon: 'i-lucide-clipboard-list',
    trend: '+12%',
    tone: 'success' as const
  },
  {
    key: 'progress',
    title: 'In Progress',
    value: String(metrics.value.inProgress),
    icon: 'i-lucide-git-branch',
    trend: 'In Flow',
    tone: 'primary' as const
  },
  {
    key: 'done',
    title: 'Completed',
    value: String(metrics.value.completed),
    icon: 'i-lucide-circle-check-big',
    trend: '98%',
    tone: 'success' as const
  },
  {
    key: 'rate',
    title: 'Goal Hit Rate',
    value: `${metrics.value.hitRate}%`,
    icon: 'i-lucide-trophy',
    trend: 'Target Hit',
    tone: 'warning' as const
  }
])

const filteredTasks = computed(() => {
  const term = q.value.trim().toLowerCase()
  return tasks.value.filter(task => {
    const bySearch =
      !term ||
      task.title.toLowerCase().includes(term) ||
      task.summary.toLowerCase().includes(term) ||
      task.assignee.toLowerCase().includes(term)

    const byFilter = filter.value === 'all' || task.priority === 'critical'
    return bySearch && byFilter
  })
})

const sprintProgress = computed(() => {
  const done = tasks.value.flatMap(task => task.checklist).filter(item => item.done).length
  const total = tasks.value.flatMap(task => task.checklist).length
  const percent = total ? Math.round((done / total) * 100) : 0
  return { done, total, percent }
})

const monthlyAlignment = computed(() => {
  const monthly = tasks.value.filter(task => task.goalCycle === 'monthly')
  const target = monthly.reduce((sum, task) => sum + task.goalTargetUnits, 0)
  const completed = monthly.flatMap(task => task.checklist).filter(item => item.done).length * 120
  const percent = target ? Math.round((completed / target) * 100) : 0
  return {
    completed,
    target,
    percent
  }
})

const resetCreateState = () => {
  createState.title = ''
  createState.description = ''
  createState.assignee = ''
  createState.goalCycle = 'weekly'
  createState.milestones = [
    createMilestone('Initial client outreach and qualification'),
    createMilestone('')
  ]
}

const toast = useToast()

const onRemoveMilestone = (index: number) => {
  if (createState.milestones.length <= 1) {
    createState.milestones[0] = createMilestone('')
    return
  }
  createState.milestones.splice(index, 1)
}

const onAddMilestone = () => {
  createState.milestones.unshift(createMilestone(''))
}

const onToggleMilestone = (index: number, value: boolean | 'indeterminate') => {
  const checked = value === true
  const milestone = createState.milestones[index]
  if (!milestone) return

  milestone.done = checked
  if (!checked) return

  const [moved] = createState.milestones.splice(index, 1)
  if (!moved) return
  createState.milestones.push(moved)
}

const onCreateTask = () => {
  const description = createState.description.trim()
  if (!createState.title.trim() || !description || !createState.assignee) {
    toast.add({
      color: 'error',
      title: 'Missing fields',
      description: 'Please add title, description and assignee.'
    })
    return
  }

  const task = createTask({
    title: createState.title.trim(),
    description,
    assignee: createState.assignee,
    goalCycle: createState.goalCycle,
    milestones: createState.milestones.map(item => item.text.trim())
  })

  toast.add({
    color: 'success',
    title: 'Task created',
    description: `${task.ref} has been added to the queue.`
  })

  createOpen.value = false
  resetCreateState()
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <UInput
        v-model="q"
        icon="i-lucide-search"
        placeholder="Search tasks, teams, or members..."
        class="w-full max-w-lg"
      />
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-calendar"
          variant="subtle"
          color="neutral"
        >
          This Week
        </UButton>
        <UButton
          icon="i-lucide-plus"
          @click="createOpen = true"
        >
          Create Task
        </UButton>
      </div>
    </div>

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

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <UCard>
        <template #header>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-lg font-semibold">Priority Task Queue</h2>
              <p class="text-sm text-muted">Overview of active tasks and assignments.</p>
            </div>
            <div size="sm">
              <UButton
                :variant="filter === 'all' ? 'solid' : 'subtle'"
                color="neutral"
                @click="filter = 'all'"
              >
                All Tasks
              </UButton>
              <UButton
                :variant="filter === 'critical' ? 'solid' : 'subtle'"
                color="error"
                @click="filter = 'critical'"
              >
                Critical
              </UButton>
            </div>
          </div>
        </template>

        <div class="space-y-2">
          <div
            v-for="task in filteredTasks"
            :key="task.id"
            class="rounded-md border border-default p-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-3">
              <div class="space-y-1">
                <NuxtLink
                  :to="`/tasks/${task.id}`"
                  class="font-semibold hover:text-primary"
                >
                  {{ task.title }}
                </NuxtLink>
                <p class="text-sm text-muted">{{ task.category }} · {{ task.summary }}</p>
              </div>
              <UDropdownMenu
                :items="[
                  [
                    { label: 'Open task', icon: 'i-lucide-eye', to: `/tasks/${task.id}` },
                    { label: 'Mark completed', icon: 'i-lucide-check-check' }
                  ]
                ]"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-ellipsis-vertical"
                />
              </UDropdownMenu>
            </div>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <UBadge
                :label="statusMeta[task.status].label"
                :color="statusMeta[task.status].color"
                variant="subtle"
              />
              <UBadge
                :label="priorityMeta[task.priority].label"
                :color="priorityMeta[task.priority].color"
                variant="soft"
              />
              <UBadge
                color="neutral"
                variant="outline"
              >
                {{ task.dueDate }}
              </UBadge>
              <UBadge
                color="neutral"
                variant="soft"
              >
                {{ task.assignee }}
              </UBadge>
            </div>
          </div>
        </div>
      </UCard>

      <div class="space-y-4">
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
                <span>{{ sprintProgress.total - sprintProgress.done }} remaining</span>
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
    </div>
  </div>

  <UModal
    v-model:open="createOpen"
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
            <h4 class="text-2xl font-semibold">New Task Initiation</h4>
            <p class="mt-2 text-sm text-muted">
              Complete the configuration for the new CRM directive. Ensure milestones are clearly
              defined for the assigned team.
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
            label="Task Name"
          >
            <UInput
              v-model="createState.title"
              size="lg"
              class="w-full"
              placeholder="Enter task name..."
            />
          </UFormField>
          <UFormField label="Description">
            <FormEditor
              v-model="createState.description"
              content-type="markdown"
              placeholder="Briefly describe the task..."
              min-height-class="min-h-32"
            />
          </UFormField>
          <div class="grid gap-4 grid-cols-3">
            <UFormField label="Priority">
              <USelect
                size="lg"
                class="w-full"
                placeholder="Select priority..."
              />
            </UFormField>
            <UFormField label="Due date">
              <UInputDate
                size="lg"
                class="w-full"
              />
            </UFormField>
          </div>
          <UFormField label="Assignee">
            <FormAutocomplete
              api="/api/users"
              :query="{ options: true }"
              size="lg"
              class="w-full"
              placeholder="Select assignee..."
            />
          </UFormField>
          <UFormField>
            <template #label>
              <div class="flex items-center justify-between gap-2">
                <span>Milestone checklist</span>
                <UButton
                  size="xs"
                  variant="ghost"
                  icon="i-lucide-plus"
                  @click="onAddMilestone"
                >
                  Add Milestone
                </UButton>
              </div>
            </template>
            <div
              ref="milestonesListRef"
              class="space-y-2"
            >
              <div
                v-for="(milestone, index) in createState.milestones"
                :key="milestone.id"
                class="group flex items-center gap-2 rounded-lg border border-default bg-elevated/50 px-3 py-2"
              >
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-grip-vertical"
                  class="milestone-handle cursor-grab active:cursor-grabbing"
                />
                <UCheckbox
                  :model-value="milestone.done"
                  @update:model-value="onToggleMilestone(index, $event)"
                />
                <UInput
                  v-model="milestone.text"
                  :placeholder="
                    index === 0
                      ? 'Initial client outreach and qualification'
                      : 'Add next requirement...'
                  "
                  class="flex-1"
                  variant="none"
                  :ui="{ base: 'px-0' }"
                />
                <UButton
                  v-if="createState.milestones.length"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  class="opacity-0 transition-opacity group-hover:opacity-100"
                  @click="onRemoveMilestone(index)"
                />
              </div>
            </div>
          </UFormField>
          <div class="flex w-full justify-end gap-2">
            <UButton
              color="neutral"
              variant="subtle"
              @click="createOpen = false"
            >
              Cancel
            </UButton>
            <UButton
              icon="i-lucide-rocket"
              @click="onCreateTask"
            >
              Create Task
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
