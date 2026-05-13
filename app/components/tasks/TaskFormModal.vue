<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'

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

const newForm = (v?: Partial<TTask>): TTask => {
  return {
    id: v?.id ?? -Date.now(),
    name: v?.name ?? '',
    description: v?.description ?? '',
    dueAt: v?.dueAt ?? null,
    status: v?.status ?? TaskStatus.TODO,
    priority: v?.priority ?? TaskPriority.MEDIUM,
    items: v?.items?.length ? v.items : [newTaskItem()],
    createdAt: v?.createdAt ?? new Date(),
    updatedAt: v?.updatedAt ?? new Date(),
    deletedAt: v?.deletedAt ?? null,
    creatorId: v?.creatorId ?? null,
    reviewedAt: v?.reviewedAt ?? null,
    reviewerId: v?.reviewerId ?? null,
    submittedAt: v?.submittedAt ?? null,
    submitterId: v?.submitterId ?? null
  }
}

const form = ref(newForm())
const formRef = useTemplateRef('formRef')

const taskStatuses = useTaskStatusItems()
const taskPriorities = useTaskPriorityItems()

const { mutate, isPending } = useTaskPostMutation()
const onSubmit = (event: FormSubmitEvent<TTask>) => {
  mutate(event.data, {
    onSuccess(data) {
      navigateTo(`/tasks/${data.id}`)
      open.value = false
    },
    onError(error) {
      const { message, errors } = parseError(error)
      console.log('Errors', message, errors)
      if (errors?.length) formRef.value?.setErrors(errors)
      else formRef.value?.setErrors([{ name: 'name', message }])
    }
  })
}

const onReset = () => {
  form.value = newForm()
  open.value = false
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
              name="i-lucide-badge-plus"
              class="size-6 text-primary"
            />
          </div>
          <div>
            <h4 class="text-2xl font-semibold">New Task Initiation</h4>
            <p class="mt-2 text-sm text-muted">
              Complete the configuration for this CRM directive. Ensure items are clearly defined
              for the assigned team.
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
        <UForm
          ref="formRef"
          :state="form"
          :disabled="isPending"
          class="grid grid-cols-12 gap-4 p-8 col-span-8 overflow-y-auto"
          @submit="onSubmit"
        >
          <div class="flex items-center justify-between col-span-12">
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
            name="name"
            label="Name"
            class="col-span-12"
          >
            <UInput
              v-model="form.name"
              size="lg"
              class="w-full"
              placeholder="Enter task name..."
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
              placeholder="Add short task details..."
              min-height-class="min-h-32"
            />
          </UFormField>
          <UFormField
            name="status"
            class="col-span-4"
          >
            <USelect
              v-model="form.status"
              :items="taskStatuses"
              size="lg"
              class="w-full"
              placeholder="Select task status..."
            />
          </UFormField>
          <UFormField
            name="priority"
            class="col-span-4"
          >
            <USelect
              v-model="form.priority"
              :items="taskPriorities"
              size="lg"
              class="w-full"
              placeholder="Select task priority..."
            />
          </UFormField>
          <UFormField
            name="dueAt"
            class="col-span-4"
          >
            <FormDate
              v-model="form.dueAt"
              size="lg"
              placeholder="Select due date..."
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
              Create Task
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
