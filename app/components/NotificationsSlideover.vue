<script setup lang="ts">
import type { TNotificationInboxItem } from '~~/shared/types'
import { formatTimeAgo } from '@vueuse/core'

const { isNotificationsOpen } = useDashboard()
const { notifications, hasUnread, pending, refresh, markRead, markAllRead } = useNotifications()
const { getAttachment } = useGetAttachment()
const router = useRouter()

const markingAll = ref(false)

watch(isNotificationsOpen, open => {
  if (open) refresh()
})

const senderAvatar = (notification: TNotificationInboxItem) => {
  return getAttachment(notification.sender?.avatar?.path)
}

const onSelect = async (notification: TNotificationInboxItem) => {
  if (notification.unread) {
    try {
      await markRead(notification.id)
    } catch {
      // navigation still happens
    }
  }

  isNotificationsOpen.value = false

  if (notification.href) {
    await router.push(notification.href)
  }
}
</script>

<template>
  <USlideover
    v-model:open="isNotificationsOpen"
    title="Notifications"
  >
    <template #actions>
      <UButton
        v-if="hasUnread"
        color="neutral"
        variant="ghost"
        size="xs"
        :loading="markingAll"
        @click="
          async () => {
            markingAll = true
            try {
              await markAllRead()
            } finally {
              markingAll = false
            }
          }
        "
      >
        Mark all read
      </UButton>
    </template>

    <template #body>
      <div
        v-if="pending && !notifications.length"
        class="text-sm text-muted py-6 text-center"
      >
        Loading...
      </div>

      <div
        v-else-if="!notifications.length"
        class="text-sm text-muted py-6 text-center"
      >
        No notifications yet
      </div>

      <button
        v-for="notification in notifications"
        :key="notification.id"
        type="button"
        class="w-full text-left px-3 py-2.5 rounded-md hover:bg-elevated/50 flex items-center gap-3 relative -mx-3 first:-mt-3 last:-mb-3"
        @click="onSelect(notification)"
      >
        <UChip
          color="error"
          :show="!!notification.unread"
          inset
        >
          <UAvatar
            :src="senderAvatar(notification)"
            :alt="notification.sender?.name || 'System'"
            size="md"
          />
        </UChip>

        <div class="text-sm flex-1 min-w-0">
          <p class="flex items-center justify-between gap-2">
            <span class="text-highlighted font-medium truncate">
              {{ notification.title }}
            </span>

            <time
              :datetime="notification.date"
              class="text-muted text-xs shrink-0"
              v-text="formatTimeAgo(new Date(notification.date))"
            />
          </p>

          <p class="text-dimmed line-clamp-2">
            {{ notification.body }}
          </p>
        </div>
      </button>
    </template>
  </USlideover>
</template>
