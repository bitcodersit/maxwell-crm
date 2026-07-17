import type { TNotificationInboxItem, TNotificationsResponse } from '~~/shared/types'

const NOTIFICATIONS_KEY = 'notifications-inbox'

const _useNotifications = () => {
  const { data, status, error, refresh, pending } = useFetch<TNotificationsResponse>(
    '/api/notifications',
    {
      key: NOTIFICATIONS_KEY,
      query: {
        perPage: 30,
        page: 1
      },
      default: () => ({
        data: [],
        unreadCount: 0,
        page: 1,
        total: 0,
        perPage: 30
      })
    }
  )

  const notifications = computed(() => data.value?.data ?? [])
  const unreadCount = computed(() => data.value?.unreadCount ?? 0)
  const hasUnread = computed(() => unreadCount.value > 0)
  const unreadBadge = computed(() => {
    if (!unreadCount.value) return undefined
    return unreadCount.value > 99 ? '99+' : String(unreadCount.value)
  })

  const markRead = async (id: number) => {
    const item = notifications.value.find(n => n.id === id)
    if (!item || !item.unread) return item

    // Optimistic update
    item.unread = false
    item.readAt = new Date().toISOString()
    if (data.value) {
      data.value.unreadCount = Math.max(0, (data.value.unreadCount ?? 1) - 1)
    }

    try {
      const updated = await $fetch<TNotificationInboxItem>(`/api/notifications/${id}`, {
        method: 'PATCH'
      })
      const index = notifications.value.findIndex(n => n.id === id)
      if (index >= 0 && data.value?.data) {
        data.value.data[index] = updated
      }
      return updated
    } catch (err) {
      await refresh()
      throw err
    }
  }

  const markAllRead = async () => {
    const previous = data.value
    if (data.value) {
      data.value.unreadCount = 0
      data.value.data = data.value.data.map(item => ({
        ...item,
        unread: false,
        readAt: item.readAt ?? new Date().toISOString()
      }))
    }

    try {
      await $fetch('/api/notifications/read-all', {
        method: 'POST'
      })
    } catch (err) {
      data.value = previous
      await refresh()
      throw err
    }
  }

  return {
    data,
    notifications,
    unreadCount,
    hasUnread,
    unreadBadge,
    status,
    error,
    pending,
    refresh,
    markRead,
    markAllRead
  }
}

export const useNotifications = createSharedComposable(_useNotifications)
