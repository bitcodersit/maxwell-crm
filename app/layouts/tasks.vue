<script setup lang="ts">
const router = useRouter()
const query = ref<Record<string, any>>({
  perPage: 10,
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW],
  orderBy: {
    dueAt: 'asc'
  }
})

const queryFormatted = computed(() => {
  return calendarFormatDates(query.value, ['dueAt'], {
    formatStr: 'yyyy-MM-dd'
  })
})

const { data, isFetching, isFetchingNextPage, fetchNextPage } = useTasksQuery(queryFormatted)

const tasks = computed(() => data.value?.pages.flatMap(page => page.data) || [])

const { item, onRef } = useArrows(
  computed(() => tasks.value),
  task => task?.id,
  task => {
    router.push(`/tasks/${task.id}`)
  }
)

const onScroll = (event: Event) => {
  const target = event.target as HTMLElement
  if (target.scrollTop + target.clientHeight >= target.scrollHeight) {
    fetchNextPage()
  }
}
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <div class="flex overflow-hidden h-full">
      <div class="w-96 border-r h-full flex flex-col flex-none border-default relative">
        <ClientOnly>
          <UProgress
            v-if="isFetching"
            size="sm"
            class="absolute top-0 left-0 w-full"
            :ui="{ base: 'rounded-none' }"
          />
        </ClientOnly>
        <div class="px-3 py-3 flex flex-wrap gap-1 border-b border-default">
          <div class="flex-1 flex items-center flex-wrap gap-1">
            <FilterCheckbox
              v-model="query.status"
              api="/api/tasks/statuses"
              dense
              label="Status"
            />
            <FilterCheckbox
              v-model="query.priority"
              api="/api/tasks/priorities"
              dense
              label="Priority"
            />
            <FilterDate
              v-model="query.dueAt"
              dense
              label="Due"
            />
          </div>
          <div class="flex-1 flex items-center justify-end gap-1">
            <UButton
              size="xs"
              variant="subtle"
              class="rounded-full"
            >
              <BaseOrderByDropdown
                v-model="query.orderBy"
                :items="[
                  { label: 'Status', value: 'status' },
                  { label: 'Priority', value: 'priority' },
                  { label: 'Due', value: 'dueAt' }
                ]"
              />
            </UButton>
          </div>
        </div>
        <!-- on scroll bottom, fetch next page -->
        <div
          class="overflow-y-auto scrollbar divide-y divide-default flex-1"
          @scroll="onScroll"
        >
          <div
            v-for="(task, index) in tasks"
            :key="index"
            :ref="el => onRef(el, task)"
          >
            <TaskListItem
              :task="task"
              @click="item = task"
            />
          </div>
        </div>
        <div
          v-if="isFetchingNextPage"
          class="flex justify-center"
        >
          <UButton
            loading
            variant="link"
          />
        </div>
      </div>
      <slot />
    </div>
  </NuxtLayout>
</template>
