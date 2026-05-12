<script setup lang="ts">
const router = useRouter()
const query = ref<Record<string, any>>({
  page: 1,
  perPage: 10
})

const { data } = useTasksQuery(query)
const { item, onRef } = useArrows(
  computed(() => data.value.data),
  task => task?.id,
  task => {
    router.push(`/tasks/${task.id}`)
  }
)
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <div class="flex overflow-hidden h-full">
      <div class="w-96 border-r h-full flex flex-col flex-none border-default">
        <div class="p-4"></div>
        <div class="overflow-y-auto scrollbar divide-y divide-default flex-1">
          <div
            v-for="(task, index) in data.data"
            :key="index"
            :ref="el => onRef(el, task)"
          >
            <TaskListItem
              :task="task"
              @click="item = task"
            />
          </div>
        </div>
      </div>
      <slot />
    </div>
  </NuxtLayout>
</template>
