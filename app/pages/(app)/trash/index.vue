<script setup lang="ts">
definePageMeta({
  title: 'Trash'
})

const route = useRoute()
const { user } = useCurrentUser()

const canReadUsers = computed(() => !!(user.value?.readAnyUsers || user.value?.readOwnUsers))
const canReadCustomers = computed(() => !!user.value?.readAnyUsers)

const tabItems = computed(() => {
  const items: { label: string; value: string; icon: string }[] = []
  if (canReadUsers.value) {
    items.push({
      label: 'Users',
      value: 'users',
      icon: 'i-lucide-users'
    })
  }
  if (canReadCustomers.value) {
    items.push({
      label: 'Customers',
      value: 'customers',
      icon: 'i-lucide-user-round-search'
    })
  }
  return items
})

const tab = computed({
  get() {
    const requested = String(route.query.tab || '')
    if (requested === 'customers' && canReadCustomers.value) return 'customers'
    if (requested === 'users' && canReadUsers.value) return 'users'
    return tabItems.value[0]?.value || 'users'
  },
  set(value: string) {
    navigateTo(
      {
        query: {
          ...route.query,
          tab: value
        }
      },
      { replace: true }
    )
  }
})
</script>

<template>
  <div class="flex-1 flex flex-col gap-4 overflow-hidden min-h-0">
    <div class="flex-none flex">
      <UTabs
        v-model="tab"
        :items="tabItems"
        variant="pill"
        size="sm"
        :content="false"
        class="flex-none"
        :ui="{
          trigger: 'gap-1.5',
          leadingIcon: 'size-3.5'
        }"
      />
    </div>
    <UsersCrud
      v-if="tab === 'users'"
      trashed
    />
    <CustomersCrud
      v-else-if="tab === 'customers'"
      trashed
    />
  </div>
</template>
