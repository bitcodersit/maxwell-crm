<script setup lang="ts">
import { TaskPriority, TaskStatus } from '~~/prisma/client/enums'
import { format, isToday } from 'date-fns'

const { data, refetch } = useFetchApi({
  api: '/api/tasks',
  server: true,
  getDefault() {
    return toPaginated<TTask>()
  }
})

const item = defineModel<TTask | null>()
const itemRefs = ref<Record<number, Element | null>>({})

const router = useRouter()
watch(item, () => {
  if (!item.value) return
  router.push(`/tasks/${item.value.id}`)
  const ref = itemRefs.value[item.value.id]
  if (!ref) return
  ref.scrollIntoView({
    block: 'nearest',
    inline: 'nearest'
  })
})

defineShortcuts({
  arrowdown: () => {
    const index = data.value.data.findIndex((task: TTask) => task.id === item.value?.id)

    if (index === -1) {
      item.value = data.value.data[0]
    } else if (index < data.value.data.length - 1) {
      item.value = data.value.data[index + 1]
    }
  },
  arrowup: () => {
    const index = data.value.data.findIndex((task: TTask) => task.id === item.value?.id)

    if (index === -1) {
      item.value = data.value.data[data.value.data.length - 1]
    } else if (index > 0) {
      item.value = data.value.data[index - 1]
    }
  }
})
</script>

<template>
  <NuxtLayout
    :name="'default'"
    :padding="false"
    :scrollable="false"
  >
    <div class="flex overflow-hidden h-full">
      <div class="w-96 border-r h-full flex flex-col flex-none border-default">
        <div class="p-4">
          <UButton
            icon="i-lucide-plus"
            variant="ghost"
            size="sm"
            @click="refetch"
          >
            Refresh
          </UButton>
        </div>
        <div class="overflow-y-auto scrollbar divide-y divide-default flex-1">
          <div
            v-for="(task, index) in data.data"
            :key="index"
            :ref="
              el => {
                itemRefs[task.id] = el as Element | null
              }
            "
          >
            <div
              class="p-4 sm:px-6 text-sm cursor-pointer border-l-2 transition-colors relative"
              :class="[
                task.status === TaskStatus.TODO ? 'text-highlighted' : 'text-toned',
                item && item.id === task.id
                  ? 'border-primary bg-primary/10'
                  : 'border-bg hover:border-primary hover:bg-primary/5'
              ]"
              @click="item = task"
            >
              <div class="flex gap-4 justify-between items-center">
                <!-- <UChip
                  
                  class="flex-none"
                > -->
                <div class="truncate">{{ task.name }}</div>
                <!-- </UChip> -->
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
                  size="sm"
                  :color="task.status === TaskStatus.TODO ? 'primary' : 'neutral'"
                  :variant="task.status === TaskStatus.TODO ? 'soft' : 'outline'"
                  :show="task.status === TaskStatus.TODO"
                >
                  {{ task.status }}
                </UBadge>
                <UBadge
                  size="sm"
                  :color="task.priority === TaskPriority.URGENT ? 'error' : 'neutral'"
                  :variant="task.priority === TaskPriority.URGENT ? 'soft' : 'outline'"
                  :show="task.priority === TaskPriority.URGENT"
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
