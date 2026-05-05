<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const route = useRoute()
const toast = useToast()

const open = ref(false)

const { user } = useUserSession()
const { title, links: panelLinks, isSearchOpen, isNotificationsOpen } = useDashboard()

const links = computed(() => {
  return [
    [
      {
        label: 'Home',
        icon: 'i-lucide-house',
        to: '/',
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Users',
        icon: 'i-lucide-users',
        to: '/users',
        visible: can(user.value, ['read-any-users', 'read-own-users']),
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Roles',
        icon: 'i-lucide-list-todo',
        to: '/roles',
        visible: can(user.value, ['read-any-roles', 'read-own-roles']),
        onSelect: () => {
          open.value = false
        },
      },
      {
        label: 'Permissions',
        icon: 'i-lucide-list-todo',
        to: '/permissions',
        visible: can(user.value, ['read-any-permissions']),
        onSelect: () => {
          open.value = false
        },
      },
      // {
      //   label: 'Inbox',
      //   icon: 'i-lucide-inbox',
      //   to: '/inbox',
      //   badge: '4',
      //   onSelect: () => {
      //     open.value = false
      //   },
      // },
      // {
      //   label: 'Customers',
      //   icon: 'i-lucide-users',
      //   to: '/customers',
      //   onSelect: () => {
      //     open.value = false
      //   },
      // },
      {
        label: 'Settings',
        to: '/settings',
        icon: 'i-lucide-settings',
        defaultOpen: true,
        type: 'trigger' as const,
        children: [
          {
            label: 'General',
            to: '/settings',
            exact: true,
            onSelect: () => {
              open.value = false
            },
          },
          // {
          //   label: 'Members',
          //   to: '/settings/members',
          //   onSelect: () => {
          //     open.value = false
          //   },
          // },
          // {
          //   label: 'Notifications',
          //   to: '/settings/notifications',
          //   onSelect: () => {
          //     open.value = false
          //   },
          // },
          {
            label: 'Security',
            to: '/settings/security',
            onSelect: () => {
              open.value = false
            },
          },
        ],
      },
    ].filter((v) => (typeof v.visible === 'boolean' ? v.visible : true)),
    [
      {
        label: 'Feedback',
        icon: 'i-lucide-message-circle',
        to: 'https://github.com/nuxt-ui-templates/dashboard',
        target: '_blank',
      },
      {
        label: 'Help & Support',
        icon: 'i-lucide-info',
        to: 'https://github.com/nuxt-ui-templates/dashboard',
        target: '_blank',
      },
    ],
  ] satisfies NavigationMenuItem[][]
})

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value.flat(),
  },
  {
    id: 'code',
    label: 'Code',
    items: [
      {
        id: 'source',
        label: 'View page source',
        icon: 'i-simple-icons-github',
        to: `https://github.com/nuxt-ui-templates/dashboard/blob/main/app/pages${
          route.path === '/' ? '/index' : route.path
        }.vue`,
        target: '_blank',
      },
    ],
  },
])

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'We use first-party cookies to enhance your experience on our website.',
    duration: 0,
    close: false,
    actions: [
      {
        label: 'Accept',
        color: 'neutral',
        variant: 'outline',
        onClick: () => {
          cookie.value = 'accepted'
        },
      },
      {
        label: 'Opt out',
        color: 'neutral',
        variant: 'ghost',
      },
    ],
  })
})

useHead({ title })
useUiColors()
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <TeamsMenu :collapsed="collapsed" />
      </template>
      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>
      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>
    <UDashboardPanel>
      <template #header>
        <UDashboardNavbar :title="title">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <!-- Search -->
            <UTooltip text="Search" :shortcuts="['S']">
              <UButton color="neutral" variant="ghost" square @click="isSearchOpen = true">
                <UIcon name="i-lucide-search" class="size-5 shrink-0" />
              </UButton>
            </UTooltip>

            <!-- Notifications -->
            <UTooltip text="Notifications" :shortcuts="['N']">
              <UButton color="neutral" variant="ghost" square @click="isNotificationsOpen = true">
                <UChip color="error" inset>
                  <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
                </UChip>
              </UButton>
            </UTooltip>

            <!-- Appearance -->
            <UTooltip text="Appearance" :shortcuts="['C']">
              <UColorModeButton />
            </UTooltip>

            <!-- Current user menu-->
            <UserMenu />
          </template>
        </UDashboardNavbar>
        <UDashboardToolbar v-if="!!panelLinks.length">
          <UNavigationMenu :items="panelLinks" highlight class="-mx-1 flex-1" />
        </UDashboardToolbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
    <NotificationsSlideover />
    <UDashboardSearch v-model:open="isSearchOpen" :groups="groups" />
  </UDashboardGroup>
</template>
