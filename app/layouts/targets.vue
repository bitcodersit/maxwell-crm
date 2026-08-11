<script setup lang="ts">
const formOpen = ref(false)
const query = ref<Record<string, any>>({
  perPage: 10,
  status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW, TaskStatus.FAILED],
  orderBy: {
    dueAt: 'asc'
  }
})

const queryFormatted = computed(() => {
  return calendarFormatDates(query.value, ['dueAt'], {
    formatStr: 'yyyy-MM-dd'
  })
})

const { data, isFetching, isFetchingNextPage, fetchNextPage } = useTargetsQuery(queryFormatted)

const targets = computed(() => data.value?.pages.flatMap(page => page.data) || [])

const { item, onRef } = useArrows(
  computed(() => targets.value),
  target => target?.id,
  target => {
    navigateTo(`/targets/${target.id}`)
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
  <TargetFormModal v-model:open="formOpen" />
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
              api="/api/targets/statuses"
              dense
              label="Status"
            />
            <FilterCheckbox
              v-model="query.priority"
              api="/api/targets/priorities"
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
            <UButton
              size="xs"
              variant="subtle"
              class="rounded-full"
              icon="i-lucide-plus"
              @click="formOpen = true"
            />
          </div>
        </div>
        <div
          class="overflow-y-auto scrollbar divide-y divide-default flex-1"
          @scroll="onScroll"
        >
          <div
            v-for="(target, index) in targets"
            :key="index"
            :ref="el => onRef(el, target)"
          >
            <TaskListItem
              :task="target"
              @click="item = target"
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
