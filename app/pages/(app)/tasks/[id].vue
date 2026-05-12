<script setup lang="ts">
import { differenceInCalendarDays, isToday } from 'date-fns'

definePageMeta({
  layout: 'tasks'
})

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))
const task = useState<TTask>(keys.task(id.value).toString())

const { user } = useUserSession()
const { mutate, isPending } = useTaskPatchMutation(id)
const { data, status } = useTaskQuery(id, v => {
  task.value = v
})

const onMutate = (update: Partial<TTask>) => {
  const diff = getDeepDiff(task.value, data.value)
  const updateKeys = Object.keys(update)
  if (updateKeys.some(key => key in diff)) {
    mutate(update)
  }
}

const statusItems = useTaskStatusItems(status => {
  task.value.status = status
  onMutate({ status })
})

const priorityItems = useTaskPriorityItems(priority => {
  task.value.priority = priority
  onMutate({ priority })
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

const onChangeDescription = useDebounceFn((value: string) => {
  task.value.description = value
  onMutate({ description: value || null })
}, 1000)

const onChangeDueAt = (value: unknown) => {
  task.value.dueAt = value as any
  onMutate({ dueAt: (value as Date | null) ?? null })
}

const onChangeUsers = useDebounceFn(() => {
  onMutate({ users: task.value.users })
}, 1000)

const onChangeTeams = useDebounceFn(() => {
  onMutate({ teams: task.value.teams })
}, 1000)
</script>

<template>
  <div
    v-if="task"
    class="flex flex-1 relative"
  >
    <UProgress
      v-if="isPending"
      size="sm"
      class="absolute top-0 left-0 w-full"
      :ui="{ base: 'rounded-none' }"
    />
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
          :disabled="!user?.can?.updateAnyTasks"
          tag="h1"
          class="text-xl font-semibold outline-none focus:ring-1 focus:ring-primary rounded-lg focus:px-4 focus:py-2 transition-all"
          @blur="onMutate({ name: task.name })"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UDropdownMenu :items="statusItems">
            <UBadge
              :color="ColorsMap[task.status]"
              size="lg"
              variant="soft"
              class="cursor-pointer"
            >
              <UIcon name="i-lucide-check-circle" />
              {{ task.status }}
            </UBadge>
          </UDropdownMenu>
          <UDropdownMenu
            :items="priorityItems"
            :disabled="!priorityItems.length"
          >
            <UBadge
              :color="ColorsMap[task.priority]"
              size="lg"
              variant="soft"
              class="cursor-pointer"
            >
              <UIcon name="i-lucide-flag" />
              {{ task.priority }}
            </UBadge>
          </UDropdownMenu>
          <FormDate
            v-model="task.dueAt"
            :mode="'single'"
            :show-mode="false"
            :disabled="!user?.can?.updateAnyTasks"
            :min-value="todayDateValue()"
            @update:model-value="onChangeDueAt"
          >
            <template #trigger>
              <UChip
                :show="!task.dueAt"
                class="cursor-pointer"
              >
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
        :editable="!!user?.can?.updateAnyTasks"
        :border-class="!user?.can?.updateAnyTasks ? 'border-none' : 'border-default'"
        :content-class="!user?.can?.updateAnyTasks ? '[&>div]:px-0 [&>div]:py-0' : ''"
        placeholder="Add short task details..."
        content-type="markdown"
        min-height-class="min-h-32"
        @update:model-value="onChangeDescription"
      />
      <TaskItems
        v-model="task.items"
        @change="onMutate({ items: task.items })"
      />
    </div>
    <div class="space-y-4 w-96 flex-none border-l border-default p-4">
      <UFormField label="Assigned users">
        <FormAutocomplete
          v-model="taskUsers"
          :query="{ options: true }"
          api="/api/users"
          size="lg"
          class="flex-1"
          placeholder="Assign user"
          @update:model-value="onChangeUsers"
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
          @update:model-value="onChangeTeams"
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
