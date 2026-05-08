<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const { tasks, statusMeta, priorityMeta } = useTasksDemo()

const taskId = computed(() => Number(route.params.id))
const task = computed(() => tasks.value.find(item => item.id === taskId.value))

const status = ref<'in-progress' | 'review' | 'delayed' | 'completed'>('in-progress')
const checklistDraft = ref('')

watch(
  task,
  value => {
    if (value) {
      status.value = value.status
    }
  },
  { immediate: true }
)

const completion = computed(() => {
  const list = task.value?.checklist || []
  const done = list.filter(item => item.done).length
  const total = list.length
  const percent = total ? Math.round((done / total) * 100) : 0
  return {
    done,
    total,
    percent
  }
})

const onUpdateStatus = () => {
  if (!task.value) return
  task.value.status = status.value
}

const onToggleMilestone = (id: string) => {
  if (!task.value) return
  task.value.checklist = task.value.checklist.map(item =>
    item.id === id ? { ...item, done: !item.done } : item
  )
}

const onAddChecklist = () => {
  if (!task.value || !checklistDraft.value.trim()) return
  task.value.checklist = [
    ...task.value.checklist,
    {
      id: `milestone-${task.value.id}-${Date.now()}`,
      text: checklistDraft.value.trim(),
      done: false
    }
  ]
  checklistDraft.value = ''
}
</script>

<template>
  <div
    v-if="task"
    class="space-y-4"
  >
    <div class="flex items-center justify-between">
      <UButton
        icon="i-lucide-arrow-left"
        variant="ghost"
        color="neutral"
        @click="router.push('/tasks')"
      >
        Back to task list
      </UButton>
      <UBadge
        color="neutral"
        variant="soft"
      >
        {{ task.ref }}
      </UBadge>
    </div>

    <div class="grid gap-4 lg:grid-cols-[2fr_1fr]">
      <div class="space-y-4">
        <UCard>
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <UBadge
                color="neutral"
                variant="subtle"
              >
                {{ task.category }}
              </UBadge>
              <UBadge
                :color="priorityMeta[task.priority].color"
                variant="soft"
              >
                {{ priorityMeta[task.priority].label }} Priority
              </UBadge>
            </div>
            <h1 class="text-2xl font-semibold">{{ task.title }}</h1>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-calendar" />
                Due {{ task.dueDate }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-users" />
                Team: {{ task.team }}
              </span>
              <span class="inline-flex items-center gap-1">
                <UIcon name="i-lucide-workflow" />
                Pipeline: {{ task.pipeline }}
              </span>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h2 class="text-lg font-semibold">Full Description</h2>
          </template>
          <div class="space-y-4 text-sm leading-6 text-toned">
            <p
              v-for="(paragraph, index) in task.description.split('\n\n')"
              :key="index"
            >
              {{ paragraph }}
            </p>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-md border border-default p-3">
                <div class="text-xs uppercase text-muted">Data Points</div>
                <div class="mt-1 font-medium">Review 14,000+ interactions</div>
              </div>
              <div class="rounded-md border border-default p-3">
                <div class="text-xs uppercase text-muted">Key Goal</div>
                <div class="mt-1 font-medium">Reduce churn by 12.5%</div>
              </div>
            </div>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center justify-between gap-2">
              <h2 class="text-lg font-semibold">Interactive Checklist</h2>
              <span class="text-sm font-medium">{{ completion.percent }}% Complete</span>
            </div>
          </template>

          <div class="space-y-3">
            <UProgress :model-value="completion.percent" />

            <div class="space-y-2">
              <div
                v-for="milestone in task.checklist"
                :key="milestone.id"
                class="flex items-start gap-2 rounded-md border border-default p-3"
              >
                <UCheckbox
                  :model-value="milestone.done"
                  @update:model-value="onToggleMilestone(milestone.id)"
                />
                <div class="min-w-0">
                  <p
                    class="font-medium"
                    :class="milestone.done ? 'line-through text-muted' : ''"
                  >
                    {{ milestone.text }}
                  </p>
                  <p class="text-xs text-muted">
                    {{ milestone.doneBy ? `Completed by ${milestone.doneBy}` : 'Pending peer review' }}
                  </p>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <UInput
                v-model="checklistDraft"
                placeholder="Add checklist item"
                class="flex-1"
              />
              <UButton
                icon="i-lucide-plus"
                variant="subtle"
                @click="onAddChecklist"
              >
                Add
              </UButton>
            </div>
          </div>
        </UCard>
      </div>

      <div class="space-y-4">
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Task Status</h3>
          </template>
          <div class="space-y-3">
            <USelect
              v-model="status"
              :items="[
                { label: 'In Progress', value: 'in-progress' },
                { label: 'Review', value: 'review' },
                { label: 'Delayed', value: 'delayed' },
                { label: 'Completed', value: 'completed' }
              ]"
            />
            <UButton
              block
              icon="i-lucide-save"
              @click="onUpdateStatus"
            >
              Update Status
            </UButton>
            <UBadge
              :color="statusMeta[task.status].color"
              variant="soft"
            >
              {{ statusMeta[task.status].label }}
            </UBadge>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Ownership</h3>
          </template>
          <div class="space-y-2 text-sm">
            <p><span class="text-muted">Owner:</span> {{ task.assignee }}</p>
            <p><span class="text-muted">Reviewer:</span> Unassigned</p>
            <UButton
              size="sm"
              variant="subtle"
              color="neutral"
            >
              Assign Reviewer
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold uppercase text-muted">Resources</h3>
          </template>
          <div class="space-y-2">
            <template v-if="task.resources.length">
              <div
                v-for="resource in task.resources"
                :key="resource.id"
                class="flex items-center justify-between rounded-md border border-default p-2"
              >
                <div class="flex items-center gap-2">
                  <UIcon :name="resource.icon" />
                  <div>
                    <p class="text-sm font-medium">{{ resource.name }}</p>
                    <p class="text-xs text-muted">{{ resource.size }}</p>
                  </div>
                </div>
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
            <UButton
              block
              variant="subtle"
              icon="i-lucide-upload"
            >
              Upload Document
            </UButton>
          </div>
        </UCard>
      </div>
    </div>
  </div>

  <UCard
    v-else
    class="max-w-xl"
  >
    <UAlert
      color="warning"
      variant="subtle"
      title="Task not found"
      description="This task does not exist in the current dummy dataset."
    />
    <template #footer>
      <UButton
        icon="i-lucide-arrow-left"
        variant="subtle"
        @click="router.push('/tasks')"
      >
        Back to tasks
      </UButton>
    </template>
  </UCard>
</template>
