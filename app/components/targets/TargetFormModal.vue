<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import { TargetFrequency } from '~~/prisma/client/enums'

type TTargetForm = {
  name: string
  description: string
  status: TaskStatus
  priority: TaskPriority
  frequency: TargetFrequency
  intervalDays: number | null
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

const newForm = (v?: Partial<TTargetForm>): TTargetForm => {
  const start = v?.rangeStart ?? new Date()
  const end = v?.rangeEnd ?? new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000)
  return {
    name: v?.name ?? '',
    description: v?.description ?? '',
    status: v?.status ?? TaskStatus.TODO,
    priority: v?.priority ?? TaskPriority.MEDIUM,
    frequency: v?.frequency ?? TargetFrequency.WEEKLY,
    intervalDays: v?.intervalDays ?? 7,
    rangeStart: start,
    rangeEnd: end,
    endsAt: v?.endsAt ?? null,
    items: v?.items?.length ? v.items : [newTaskItem()]
  }
}

const form = ref(newForm())
const formRef = useTemplateRef('formRef')

const taskStatuses = useTargetStatusItems()
const taskPriorities = useTargetPriorityItems()
const frequencies = useTargetFrequencyItems()

const onReset = () => {
  form.value = newForm()
  open.value = false
}

const { mutate, isPending } = useTargetPostMutation()
const onSubmit = (event: FormSubmitEvent<TTargetForm>) => {
  const payload = {
    ...event.data,
    intervalDays:
      event.data.frequency === TargetFrequency.CUSTOM ? event.data.intervalDays : null
  }
  mutate(payload, {
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
              Create a recurring target with a weekly, monthly, or custom date range. Each period
              becomes a trackable occurrence.
            </p>
          </div>
          <div class="space-y-4 text-sm">
            <div class="flex items-start gap-2">
              <UIcon
                name="i-lucide-repeat"
                class="mt-0.5 size-5 text-primary"
              />
              <p>
                <span class="font-medium text-default">Recurring windows</span><br />
                <span class="text-muted"
                  >Occurrences generate automatically when a new period starts.</span
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
                  >Set the first window; later periods advance by frequency.</span
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
            label="Status"
            name="status"
            class="col-span-4"
          >
            <USelect
              v-model="form.status"
              :items="taskStatuses"
              size="lg"
              class="w-full"
              placeholder="Select status..."
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
            v-if="form.frequency === TargetFrequency.CUSTOM"
            required
            name="intervalDays"
            label="Every N days"
            class="col-span-4"
          >
            <UInput
              v-model.number="form.intervalDays"
              type="number"
              min="1"
              size="lg"
              class="w-full"
              placeholder="e.g. 14"
            />
          </UFormField>
          <UFormField
            required
            name="rangeStart"
            label="Range start"
            class="col-span-4"
          >
            <FormDate
              v-model="form.rangeStart"
              size="lg"
              placeholder="Start date..."
            />
          </UFormField>
          <UFormField
            required
            name="rangeEnd"
            label="Range end"
            class="col-span-4"
          >
            <FormDate
              v-model="form.rangeEnd"
              size="lg"
              placeholder="End date..."
            />
          </UFormField>
          <UFormField
            name="endsAt"
            label="Ends at (optional)"
            class="col-span-4"
          >
            <FormDate
              v-model="form.endsAt"
              size="lg"
              placeholder="Stop recurring..."
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
            <TaskItems v-model="form.items" />
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
