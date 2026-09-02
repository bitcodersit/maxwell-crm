<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { TargetFrequency, TaskPriority } from '~~/prisma/client/enums'
import { getWindowForFrequency } from '~~/shared/utils/targetWindows'

type TTargetForm = {
  name: string
  description: string
  priority: TaskPriority
  frequency: TargetFrequency
  rangeStart: Date | null
  rangeEnd: Date | null
  endsAt: Date | null
  items: TTaskItem[]
}

const open = defineModel<boolean>('open', {
  default: false
})

const newTaskItem = (v?: Partial<TTaskItem>): TTaskItem => {
  return {
    id: v?.id ?? -Date.now(),
    taskId: v?.taskId ?? 0,
    name: v?.name ?? '',
    status: v?.status ?? TaskItemStatus.TODO,
    sortOrder: v?.sortOrder ?? 0,
    completedAt: v?.completedAt ?? null,
    completedById: v?.completedById ?? null,
    createdAt: v?.createdAt ?? new Date(),
    updatedAt: v?.updatedAt ?? new Date(),
    deletedAt: v?.deletedAt ?? null
  }
}

const applyFrequencyWindow = (frequency: TargetFrequency, formState: TTargetForm) => {
  const window = getWindowForFrequency(frequency)
  formState.rangeStart = window.rangeStart
  formState.rangeEnd = window.rangeEnd
}

const newForm = (v?: Partial<TTargetForm>): TTargetForm => {
  const frequency = v?.frequency ?? TargetFrequency.WEEKLY
  const window = getWindowForFrequency(frequency)
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    priority: v?.priority ?? TaskPriority.MEDIUM,
    frequency,
    rangeStart: v?.rangeStart ?? window.rangeStart,
    rangeEnd: v?.rangeEnd ?? window.rangeEnd,
    endsAt: v?.endsAt ?? null,
    items: v?.items?.length ? v.items : [newTaskItem()]
  }
}

const form = ref(newForm())
const formRef = useTemplateRef('formRef')
const rangeLocked = computed(
  () =>
    form.value.frequency === TargetFrequency.WEEKLY ||
    form.value.frequency === TargetFrequency.MONTHLY
)

const taskPriorities = useTargetPriorityItems()
const frequencies = useTargetFrequencyItems()

watch(
  () => form.value.frequency,
  frequency => {
    applyFrequencyWindow(frequency, form.value)
  }
)

const onReset = () => {
  form.value = newForm()
  open.value = false
}

const { mutate, isPending } = useTargetPostMutation()
const onSubmit = (event: FormSubmitEvent<TTargetForm>) => {
  mutate(event.data, {
    onSuccess(data) {
      onReset()
      navigateTo(`/targets/${data.id}`)
    },
    onError(error) {
      const { message, errors } = parseError(error)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'name', message }])
    }
  })
}
</script>

<template>
  <UModal
    v-model:open="open"
    :ui="{ content: 'max-w-5xl' }"
  >
    <template #content="{ close }">
      <div class="grid grid-cols-12 overflow-hidden">
        <div class="border-r border-default/80 p-8 space-y-8 col-span-4 bg-elevated/30">
          <div class="inline-flex rounded-lg bg-primary/15 p-3">
            <UIcon
              name="i-lucide-target"
              class="size-6 text-primary"
            />
          </div>
          <div>
            <h4 class="text-2xl font-semibold">New Target</h4>
            <p class="mt-2 text-sm text-muted">
              Create a cycling target with a weekly, monthly, or custom date range. Each period
              becomes its own snapshot.
            </p>
          </div>
          <div class="space-y-4 text-sm">
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-repeat"
                class="mt-0.5 size-5 text-primary"
              />
              <p>
                <span class="font-medium text-default">Independent cycles</span><br />
                <span class="text-muted"
                  >When a window ends, a new cycle is created without changing past ones.</span
                >
              </p>
            </div>
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-calendar-range"
                class="mt-0.5 size-4 text-primary"
              />
              <p>
                <span class="font-medium text-default">Date range</span><br />
                <span class="text-muted"
                  >Weekly is Saturday–Thursday. Monthly is the full calendar month.</span
                >
              </p>
            </div>
          </div>
        </div>
        <UForm
          ref="formRef"
          :state="form"
          :disabled="isPending"
          class="grid grid-cols-12 gap-4 p-8 col-span-8 overflow-y-auto"
          @submit="onSubmit"
        >
          <div class="flex items-center justify-between col-span-12">
            <div class="uppercase text-muted">Target Configuration</div>
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
            name="name"
            label="Name"
            class="col-span-12"
          >
            <UInput
              v-model="form.name"
              size="lg"
              class="w-full"
              placeholder="Enter target name..."
            />
          </UFormField>
          <UFormField
            label="Priority"
            name="priority"
            class="col-span-4"
          >
            <USelect
              v-model="form.priority"
              :items="taskPriorities"
              size="lg"
              class="w-full"
              placeholder="Select priority..."
            />
          </UFormField>
          <UFormField
            required
            name="frequency"
            label="Frequency"
            class="col-span-4"
          >
            <USelect
              v-model="form.frequency"
              :items="frequencies"
              size="lg"
              class="w-full"
              placeholder="Select frequency..."
            />
          </UFormField>
          <UFormField
            name="endsAt"
            label="Stop cycling after"
            class="col-span-4"
          >
            <FormDate
              v-model="form.endsAt"
              size="lg"
              placeholder="Optional..."
            />
          </UFormField>
          <UFormField
            required
            name="rangeStart"
            label="Range start"
            class="col-span-6"
          >
            <FormDate
              v-model="form.rangeStart"
              size="lg"
              :disabled="rangeLocked"
              placeholder="Start date..."
            />
          </UFormField>
          <UFormField
            required
            name="rangeEnd"
            label="Range end"
            class="col-span-6"
          >
            <FormDate
              v-model="form.rangeEnd"
              size="lg"
              :disabled="rangeLocked"
              placeholder="End date..."
            />
          </UFormField>
          <UFormField
            name="description"
            label="Description"
            class="col-span-12"
          >
            <FormEditor
              v-model="form.description"
              content-type="markdown"
              placeholder="Add short target details..."
              min-height-class="min-h-32"
            />
          </UFormField>
          <UFormField
            name="items"
            class="col-span-12"
          >
            <TaskItems
              v-model="form.items"
              :can-edit="true"
              :can-complete="true"
            />
          </UFormField>
          <div class="flex justify-end gap-2 col-span-12">
            <UButton
              color="neutral"
              variant="subtle"
              @click="onReset"
            >
              Cancel
            </UButton>
            <UButton
              icon="i-lucide-rocket"
              type="submit"
              :loading="isPending"
            >
              Create Target
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
