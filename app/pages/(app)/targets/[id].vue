<script setup lang="ts">
import { TargetStatus } from '~~/prisma/client/enums'
import {
  getTargetFillUp,
  isPastTargetWindow,
  isTargetSeriesEndStatus
} from '~~/shared/utils/targetWindows'

definePageMeta({
  layout: 'targets'
})

const route = useRoute()
const router = useRouter()

const id = computed(() => Number(route.params.id))
const task = useState<TTask>(keys.target(id.value).toString())

const toast = useToast()
const { confirm } = useConfirm()

const { user } = useCurrentUser()
const { mutate, isPending } = useTargetPatchMutation(id)
const { mutate: deleteTarget, isPending: isDeleting } = useTargetDeleteMutation(id)
const { data, isFetching } = useTargetQuery(id, v => {
  task.value = { ...v }
})

const tab = ref('details')
const { data: history } = useTargetHistoryQuery(id, true)

const canDelete = computed(() => !!(user.value?.deleteAnyTargets || user.value?.deleteOwnTargets))
const canUpdateAny = computed(() => !!user.value?.updateAnyTargets)
const canUpdateOwn = computed(() => !!user.value?.updateOwnTargets)
const isSeriesEnded = computed(() => isTargetSeriesEndStatus(task.value?.targetStatus))
const isWindowPast = computed(() => isPastTargetWindow(task.value?.dueAt))
const isPast = computed(() => isWindowPast.value || isSeriesEnded.value)
const isReadOnly = computed(() => isPast.value && !canUpdateAny.value)
const canEditStructure = computed(() => canUpdateAny.value && !isReadOnly.value)
const canCompleteChecklist = computed(
  () => (canUpdateAny.value || canUpdateOwn.value) && !isReadOnly.value
)

const recurrence = computed(() => task.value?.parent?.recurrence || task.value?.recurrence)

const fillUp = computed(() => getTargetFillUp(task.value?.items))

const tabItems = computed(() => [
  {
    label: 'Details',
    value: 'details',
    icon: 'i-lucide-layout-dashboard'
  },
  {
    label: 'History',
    value: 'history',
    icon: 'i-lucide-history',
    badge: history.value?.length || undefined
  }
])

const onDelete = async () => {
  if (!(await confirm('Are you sure you want to delete this target?'))) return

  deleteTarget(undefined, {
    onSuccess() {
      toast.add({
        color: 'success',
        title: 'Success! 🎉',
        description: 'Target deleted successfully'
      })
      router.push('/targets')
    },
    onError(error) {
      const { message } = parseError(error)
      toast.add({
        color: 'error',
        title: 'Error! 😭',
        description: message
      })
    }
  })
}

const onMutate = (update: Partial<TTask> & Record<string, any>) => {
  if (isReadOnly.value) return
  const diff = getDeepDiff(task.value, data.value)
  const updateKeys = Object.keys(update)
  if (
    updateKeys.some(key => key in diff) ||
    updateKeys.some(k =>
      [
        'frequency',
        'intervalDays',
        'rangeStart',
        'rangeEnd',
        'endsAt',
        'targetStatus',
        'startsAt',
        'items',
        'name',
        'priority',
        'description',
        'users',
        'teams'
      ].includes(k)
    )
  ) {
    mutate(update)
  }
}

const statusItems = useTargetStatusItems(status => {
  task.value.targetStatus = status
  onMutate({ targetStatus: status })
})

const priorityItems = useTargetPriorityItems(priority => {
  task.value.priority = priority
  onMutate({ priority })
})

const taskUsers = computed<Pick<TUser, 'id' | 'name'>[]>({
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

const taskTeams = computed<Pick<TTeam, 'id' | 'name'>[]>({
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

const onChangeStartsAt = (value: unknown) => {
  task.value.startsAt = value as any
  onMutate({ startsAt: (value as Date | null) ?? null })
}

const onChangeUsers = useDebounceFn(() => {
  onMutate({ users: task.value.users })
}, 1000)

const onChangeTeams = useDebounceFn(() => {
  onMutate({ teams: task.value.teams })
}, 1000)

const onStopOrCancel = async (status: 'STOPPED' | 'CANCELLED') => {
  const label = status === 'STOPPED' ? 'stop' : 'cancel'
  if (!(await confirm(`This will ${label} the target and stop future cycles. Continue?`))) {
    return
  }
  task.value.targetStatus = status
  onMutate({ targetStatus: status })
}

const attachments = computed<TAttachment[]>({
  get() {
    return task.value.attachable?.attachments ?? []
  },
  set(attachments) {
    task.value.attachable = {
      ...((task.value.attachable || {}) as TAttachable),
      attachments
    }
  }
})
</script>

<template>
  <div
    v-if="task"
    class="flex flex-1 relative"
  >
    <UProgress
      v-if="isPending || isDeleting"
      size="sm"
      class="absolute top-0 left-0 w-full"
      :ui="{ base: 'rounded-none' }"
    />
    <div class="space-y-4 flex-1 p-8 overflow-y-auto scrollbar">
      <div class="space-y-3">
        <div class="flex items-center justify-between gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="link"
            label="Go Back"
            class="flex-none -ml-1 p-0"
            @click="() => router.push('/targets')"
          />
          <div class="flex items-center gap-2">
            <UButton
              v-if="canUpdateAny && !isTargetSeriesEndStatus(task.targetStatus)"
              icon="i-lucide-octagon-x"
              label="Stop target"
              color="neutral"
              variant="subtle"
              @click="onStopOrCancel(TargetStatus.STOPPED)"
            />
            <UButton
              v-if="canUpdateAny && !isTargetSeriesEndStatus(task.targetStatus)"
              icon="i-lucide-ban"
              label="Cancel target"
              color="error"
              variant="outline"
              @click="onStopOrCancel(TargetStatus.CANCELLED)"
            />
            <UButton
              v-if="canDelete"
              icon="i-lucide-trash"
              label="Delete"
              color="error"
              variant="outline"
              :loading="isDeleting"
              @click="onDelete"
            />
          </div>
        </div>
        <UAlert
          v-if="isSeriesEnded"
          color="neutral"
          variant="subtle"
          :title="task.targetStatus === TargetStatus.CANCELLED ? 'Target cancelled' : 'Target stopped'"
          :description="
            isReadOnly
              ? 'This series has ended and is read-only. You do not have permission to edit it.'
              : 'This series has ended. No further cycles will be generated.'
          "
        />
        <UAlert
          v-else-if="isWindowPast"
          color="neutral"
          variant="subtle"
          title="This cycle is past"
          :description="
            isReadOnly
              ? 'Past cycles are read-only. You do not have permission to edit them.'
              : 'This cycle is past. Edits will not change other cycles.'
          "
        />
        <FormContentEditable
          v-model="task.name"
          :disabled="!canEditStructure"
          tag="h1"
          class="text-xl font-semibold outline-none focus:ring-1 focus:ring-primary rounded-lg focus:px-4 focus:py-2 transition-all"
          @blur="(name: string) => onMutate({ name })"
        />
        <div class="flex flex-wrap items-center gap-2">
          <UDropdownMenu
            :items="statusItems"
            :disabled="isReadOnly"
          >
            <TargetStatusBadge
              size="lg"
              :status="task.targetStatus"
            />
          </UDropdownMenu>
          <UDropdownMenu
            :items="priorityItems"
            :disabled="!priorityItems.length || isReadOnly"
          >
            <TaskPriorityBadge
              :size="'lg'"
              :status="
                task.targetStatus === TargetStatus.ACHIEVED ? TaskStatus.COMPLETED : TaskStatus.TODO
              "
              :priority="task.priority"
            />
          </UDropdownMenu>
          <FormDate
            v-model="task.startsAt"
            :show-mode="false"
            :disabled="!canEditStructure"
            @update:model-value="onChangeStartsAt"
          >
            <template #trigger>
              <TargetRangeBadge
                :size="'lg'"
                :starts-at="task.startsAt"
                :due-at="task.dueAt"
                :status="task.targetStatus"
              />
            </template>
          </FormDate>
          <TargetRecurrenceBadge
            v-if="recurrence"
            size="lg"
            :frequency="recurrence.frequency"
            :range-start="task.startsAt"
            :range-end="task.dueAt"
            :interval-days="recurrence.intervalDays"
          />
          <UBadge
            v-if="fillUp.totalItems"
            size="lg"
            variant="subtle"
            :color="
              fillUp.isFilledUp ? 'success' : fillUp.fillUpPercent > 0 ? 'warning' : 'neutral'
            "
            :label="
              fillUp.isFilledUp
                ? `Filled up · ${fillUp.completedItems}/${fillUp.totalItems}`
                : `${fillUp.completedItems}/${fillUp.totalItems} · ${fillUp.fillUpPercent}%`
            "
          />
        </div>
        <div
          v-if="fillUp.totalItems"
          class="space-y-1 max-w-md"
        >
          <div class="flex items-center justify-between text-xs text-muted">
            <span>Cycle fill-up</span>
            <span>{{ fillUp.fillUpPercent }}%</span>
          </div>
          <UProgress
            :model-value="fillUp.fillUpPercent"
            :color="fillUp.isFilledUp ? 'success' : 'primary'"
            size="sm"
          />
        </div>
      </div>
      <UTabs
        v-model="tab"
        :items="tabItems"
        variant="pill"
        size="sm"
        :content="false"
        class="w-full"
      />
      <template v-if="tab === 'details'">
        <FormEditor
          :model-value="task.description || ''"
          :editable="canEditStructure"
          :border-class="!canEditStructure ? 'border-none' : 'border-default'"
          :content-class="!canEditStructure ? '[&>div]:px-0 [&>div]:py-0' : ''"
          placeholder="Add short target details..."
          content-type="markdown"
          min-height-class="min-h-32"
          @update:model-value="onChangeDescription"
        />
        <ClientOnly>
          <TaskItems
            v-model="task.items"
            :can-edit="canEditStructure"
            :can-complete="canCompleteChecklist"
            @change="onMutate({ items: task.items })"
          />
        </ClientOnly>
      </template>
      <TargetHistoryPanel
        v-else
        :target-id="id"
      />
    </div>
    <div class="space-y-4 w-96 flex-none border-l border-default p-4 overflow-auto scrollbar">
      <UFormField label="Assigned users">
        <FormUsersCardPicker
          v-model="taskUsers"
          :disabled="!canEditStructure"
          @update:model-value="onChangeUsers"
        />
      </UFormField>
      <UFormField label="Assigned teams">
        <FormTeamsCardPicker
          v-model="taskTeams"
          :disabled="!canEditStructure"
          @update:model-value="onChangeTeams"
        />
      </UFormField>
      <UFormField>
        <FormAttachments
          v-model="attachments"
          :folder="'targets'"
          :attachable-id="data?.attachableId"
          :attachable-model-id="id"
          :attachable-model-type="'task'"
        />
      </UFormField>
    </div>
  </div>
  <div
    v-else-if="isNaN(id) || id <= 0"
    class="flex-1 flex items-center justify-center p-8"
  >
    <div class="max-w-md w-full text-center gap-2">
      <h1 class="text-xl font-semibold text-muted">Target will appear here</h1>
      <div class="text-dimmed">Please select a target to get started</div>
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
      title="Target not found"
      class="max-w-md w-full"
      description="This target does not exist in the current dataset."
    />
  </div>
</template>
