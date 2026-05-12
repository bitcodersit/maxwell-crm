<script setup lang="ts">
import { TaskStatus } from '~~/prisma/client/enums'
import { format, isToday } from 'date-fns'

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
            <div
              class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors relative gap-1 flex flex-col"
              :class="[
                task.status === TaskStatus.TODO ? 'text-highlighted' : 'text-toned',
                task.id === Number($route.params.id)
                  ? 'border-primary bg-primary/10'
                  : 'border-bg hover:border-primary hover:bg-primary/5'
              ]"
              @click="item = task"
            >
              <div class="flex gap-4 justify-between items-center">
                <div class="truncate">{{ task.name }}</div>
                <div
                  class="text-xs text-dimmed flex-none"
                  :class="[task.status === TaskStatus.TODO && 'font-semibold']"
                >
                  {{
                    task.dueAt
                      ? isToday(new Date(task.dueAt))
                        ? format(new Date(task.dueAt), 'HH:mm')
                        : format(new Date(task.dueAt), 'dd MMM')
                      : ''
                  }}
                </div>
              </div>
              <p class="text-dimmed line-clamp-2">
                {{ task.description }}
              </p>
              <div class="flex gap-2">
                <UBadge
                  :color="ColorsMap[task.status]"
                  size="sm"
                  variant="soft"
                >
                  {{ task.status }}
                </UBadge>
                <UBadge
                  :color="ColorsMap[task.priority]"
                  size="sm"
                  variant="soft"
                >
                  {{ task.priority }}
                </UBadge>
              </div>
            </div>
          </div>
        </div>
      </div>
      <slot />
    </div>
  </NuxtLayout>
</template>
