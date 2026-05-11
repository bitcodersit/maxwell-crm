<script setup lang="ts">
import { differenceInCalendarDays, isToday } from 'date-fns'

definePageMeta({
  layout: 'tasks'
})

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))
const task = useState<TTask>(keys.task(id.value).toString())
const dirty = ref(false)

const { mutate } = useTaskPatchMutation(id)
const { getAttachment } = useGetAttachment()

const { status } = useTaskQuery(id, v => {
  task.value = v
  dirty.value = false
})

const statusItems = getTaskStatusItems(value => {
  task.value.status = value
})

const priorityItems = getTaskPriorityItems(value => {
  task.value.priority = value
})

const daysLeft = computed(() => {
  if (!task.value?.dueAt) {
    return {
      text: 'No due date',
      color: 'neutral' as const
    }
  }

  const dueDate = new Date(task.value.dueAt)
  const diff = differenceInCalendarDays(dueDate, new Date())

  if (isToday(dueDate)) {
    return {
      text: 'Due today',
      color: 'error' as const
    }
  }

  if (diff > 0) {
    return {
      text: `${diff} day${diff === 1 ? '' : 's'} left`,
      color: diff < 7 ? ('warning' as const) : ('success' as const)
    }
  }

  const overdue = Math.abs(diff)
  return {
    text: `Overdue by ${overdue} day${overdue === 1 ? '' : 's'}`,
    color: 'error' as const
  }
})

const taskUsers = computed<Pick<TUser, 'id'>[]>({
  get() {
    return (task.value?.users || []).map(v => v.user).filter(v => !!v)
  },
  set(value) {
    task.value.users = value.map(user => ({
      user,
      userId: user.id
    })) as TTaskUser[]
  }
})

const taskTeams = computed<Pick<TTeam, 'id'>[]>({
  get() {
    return (task.value?.teams || []).map(v => v.team).filter(v => !!v)
  },
  set(value) {
    task.value.teams = value.map(team => ({
      team,
      teamId: team.id
    })) as TTaskTeam[]
  }
})

watchDebounced(
  task,
  value => {
    if (!dirty.value) {
      dirty.value = true
      return
    }
    mutate(value)
  },
  {
    deep: true,
    debounce: 1000
  }
)
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
        <!-- disabled -->
        <FormContentEditable
          v-model="task.name"
          tag="h1"
          class="text-xl font-semibold outline-none focus:ring-1 focus:ring-primary rounded-lg focus:px-4 focus:py-2 transition-all"
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
              <UChip :show="!task.dueAt">
                <UBadge
                  :color="task.dueAt ? daysLeft.color : 'neutral'"
                  size="lg"
                  variant="soft"
                >
                  <UIcon name="i-lucide-calendar" />
                  <template v-if="task.dueAt">
                    {{ $dfc(task.dueAt, 'dd MMM yyyy') }} • {{ daysLeft.text }}
                  </template>
                  <span
                    v-else
                    class="italic"
                  >
                    No due date
                  </span>
                </UBadge>
              </UChip>
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
      <TaskItems v-model="task.items" />
    </div>
    <div class="space-y-4 w-96 flex-none border-l border-default p-4">
      <UFormField label="Status">
        <USelect
          v-model="task.status"
          :items="statusItems"
          size="lg"
          class="w-full"
          value-key="value"
        />
      </UFormField>

      <UFormField label="Assigned users">
        <FormAutocomplete
          v-model="taskUsers"
          :query="{ options: true }"
          api="/api/users"
          size="lg"
          class="flex-1"
          placeholder="Assign user"
        />
      </UFormField>

      <UFormField label="Assigned teams">
        <FormAutocomplete
          v-model="taskTeams"
          :query="{ options: true }"
          api="/api/teams"
          size="lg"
          class="flex-1"
          placeholder="Assign team"
        />
      </UFormField>
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
