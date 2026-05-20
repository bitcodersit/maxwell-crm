<script setup lang="ts">
definePageMeta({
  layout: 'tasks'
})

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))
const task = useState<TTask>(keys.task(id.value).toString())

const { user } = useCurrentUser()
const { mutate, isPending } = useTaskPatchMutation(id)
const { data, isFetching } = useTaskQuery(id, v => {
  task.value = { ...v }
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

const onChangeDescription = useDebounceFn((value: TMaybe<string>) => {
  task.value.description = value ?? null
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

const attachments = computed<TAttachment[]>({
  get() {
    return task.value.attachables?.map(v => v.attachment).filter(v => !!v) ?? []
  },
  set(value) {
    task.value.attachables = value.map(attachment => ({
      ...attachment.attachables?.[0],
      attachment
    })) as TAttachable[]
  }
})
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
          :disabled="!user?.updateAnyTasks"
          tag="h1"
          class="text-xl font-semibold outline-none focus:ring-1 focus:ring-primary rounded-lg focus:px-4 focus:py-2 transition-all"
          @blur="onMutate({ name: task.name })"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UDropdownMenu :items="statusItems">
            <TaskStatusBadge
              size="lg"
              :task="task"
            />
          </UDropdownMenu>
          <UDropdownMenu
            :items="priorityItems"
            :disabled="!priorityItems.length"
          >
            <TaskPriorityBadge
              :size="'lg'"
              :status="task.status"
              :priority="task.priority"
            />
          </UDropdownMenu>
          <FormDate
            v-model="task.dueAt"
            :show-mode="false"
            :disabled="!user?.updateAnyTasks"
            @update:model-value="onChangeDueAt"
          >
            <!-- :min-value="todayDateValue()" -->
            <template #trigger>
              <TaskDueDateBadge
                :size="'lg'"
                :due-at="task.dueAt"
                :status="task.status"
              />
            </template>
          </FormDate>
        </div>
      </div>
      <FormEditor
        :model-value="task.description || ''"
        :editable="!!user?.updateAnyTasks"
        :border-class="!user?.updateAnyTasks ? 'border-none' : 'border-default'"
        :content-class="!user?.updateAnyTasks ? '[&>div]:px-0 [&>div]:py-0' : ''"
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
    <div class="space-y-4 w-96 flex-none border-l border-default p-4 overflow-auto scrollbar">
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
      <UFormField>
        <FormAttachments
          v-model="attachments"
          :folder="'tasks'"
          :attachable-id="id"
          :attachable-field="'taskId'"
        />
      </UFormField>
    </div>
  </div>
  <div
    v-else-if="isNaN(id) || id <= 0"
    class="flex-1 flex items-center justify-center p-8"
  >
    <div class="max-w-md w-full text-center gap-2">
      <h1 class="text-xl font-semibold text-muted">Task will appear here</h1>
      <div class="text-dimmed">Please select a task to get started</div>
    </div>
  </div>
  <div
    v-else-if="isFetching"
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
