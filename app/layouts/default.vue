<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

withDefaults(
  defineProps<{
    padding?: boolean
    scrollable?: boolean
  }>(),
  {
    padding: true,
    scrollable: true
  }
)

const open = ref(false)
const route = useRoute()

const { user } = useCurrentUser()
const { title, links: panelLinks, isSearchOpen, isNotificationsOpen } = useDashboard()
const { hasUnread, unreadBadge } = useNotifications()

const isNavActive = (to: string, exact = false) => {
  if (exact) return route.path === to
  return route.path === to || route.path.startsWith(`${to}/`)
}

const links = computed(() => {
  return [
    [
      {
        label: 'Home',
        icon: 'i-lucide-house',
        to: '/',
        exact: true,
        active: isNavActive('/', true),
        onSelect: () => {
          open.value = false
        }
      },

      {
        label: 'Leads',
        icon: 'i-lucide-contact',
        to: '/leads',
        // badge: '12',
        active: isNavActive('/leads'),
        visible: !!(user.value?.readAnyLeads || user.value?.readOwnLeads),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Properties',
        icon: 'i-lucide-building-2',
        to: '/properties',
        active: isNavActive('/properties'),
        visible: !!(
          user.value?.readAnyProperties ||
          user.value?.readOwnProperties ||
          user.value?.isSuperAdmin
        ),
        onSelect: () => {
          open.value = false
        }
      },
      // {
      //   label: 'Pipeline',
      //   icon: 'i-lucide-kanban',
      //   to: '/pipeline',
      //   onSelect: () => {
      //     open.value = false
      //   }
      // },
      // {
      //   label: 'Follow-ups',
      //   icon: 'i-lucide-calendar-clock',
      //   to: '/followups',
      //   badge: '3',
      //   onSelect: () => {
      //     open.value = false
      //   }
      // },
      {
        label: 'Tasks',
        icon: 'i-lucide-check-square',
        to: '/tasks',
        active: isNavActive('/tasks'),
        visible: !!(user.value?.readAnyTasks || user.value?.readOwnTasks),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Targets',
        icon: 'i-lucide-target',
        to: '/targets',
        active: isNavActive('/targets'),
        visible: !!(user.value?.readAnyTargets || user.value?.readOwnTargets),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Teams',
        icon: 'i-lucide-users-round',
        to: '/teams',
        active: isNavActive('/teams'),
        visible: !!(user.value?.readAnyTeams || user.value?.readOwnTeams),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Customers',
        icon: 'i-lucide-user-round-search',
        to: '/customers',
        active: isNavActive('/customers'),
        visible: !!user.value?.readAnyUsers,
        onSelect: () => {
          open.value = false
        }
      },

      {
        label: 'Users',
        icon: 'i-lucide-users',
        to: '/users',
        active: isNavActive('/users'),
        visible: !!(user.value?.readAnyUsers || user.value?.readOwnUsers),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Roles',
        icon: 'i-lucide-shield',
        to: '/roles',
        active: isNavActive('/roles'),
        visible: !!user.value?.readAnyRoles,
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Permissions',
        icon: 'i-lucide-key',
        to: '/permissions',
        active: isNavActive('/permissions'),
        visible: !!user.value?.readAnyPermissions,
        onSelect: () => {
          open.value = false
        }
      },
      // {
      //   label: 'Inbox',
      //   icon: 'i-lucide-inbox',
      //   to: '/inbox',
      //   badge: '4',
      //   onSelect: () => {
      //     open.value = false
      //   }
      // },
      {
        label: 'Conveyance Bills',
        icon: 'i-lucide-receipt-text',
        to: '/bills',
        active: isNavActive('/bills'),
        visible: !!(user.value?.readAnyBills || user.value?.readOwnBills),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Trash',
        icon: 'i-lucide-trash-2',
        to: '/trash',
        active: isNavActive('/trash'),
        visible: !!(user.value?.readAnyUsers || user.value?.readOwnUsers),
        onSelect: () => {
          open.value = false
        }
      },
      {
        label: 'Settings',
        to: '/settings',
        icon: 'i-lucide-settings',
        defaultOpen: true,
        type: 'trigger' as const,
        active: isNavActive('/settings'),
        children: [
          {
            label: 'General',
            to: '/settings',
            exact: true,
            active: isNavActive('/settings', true),
            onSelect: () => {
              open.value = false
            }
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
            active: isNavActive('/settings/security'),
            onSelect: () => {
              open.value = false
            }
          }
        ]
      }
    ].filter(v => (typeof v.visible === 'boolean' ? v.visible : true)),
    [
      {
        label: 'API Client',
        icon: 'i-lucide-code',
        to: '/api',
        active: isNavActive('/api'),
        visible: import.meta.dev
      }
      // {
      //   label: 'Help & Support',
      //   icon: 'i-lucide-info',
      //   to: 'https://github.com/nuxt-ui-templates/dashboard',
      //   target: '_blank'
      // }
    ].filter(v => (typeof v.visible === 'boolean' ? v.visible : true))
  ] satisfies NavigationMenuItem[][]
})

const groups = computed(() => [
  {
    id: 'links',
    label: 'Go to',
    items: links.value.flat()
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
        target: '_blank'
      }
    ]
  }
])

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
        <UDashboardSearchButton
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />
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
    <UDashboardPanel
      :ui="{
        body: [!padding ? 'p-0 sm:p-0' : '', !scrollable ? 'overflow-y-hidden' : '']
      }"
    >
      <template #header>
        <UDashboardNavbar :title="title">
          <template #leading>
            <UDashboardSidebarCollapse />
          </template>
          <template #right>
            <!-- Search -->
            <UTooltip
              text="Search"
              :shortcuts="['S']"
            >
              <UButton
                color="neutral"
                variant="ghost"
                square
                @click="isSearchOpen = true"
              >
                <UIcon
                  name="i-lucide-search"
                  class="size-5 shrink-0"
                />
              </UButton>
            </UTooltip>

            <!-- Notifications -->
            <UTooltip
              text="Notifications"
              :shortcuts="['N']"
            >
              <UButton
                color="neutral"
                variant="ghost"
                square
                @click="isNotificationsOpen = true"
              >
                <UChip
                  color="error"
                  inset
                  :show="hasUnread"
                  :text="unreadBadge"
                >
                  <UIcon
                    name="i-lucide-bell"
                    class="size-5 shrink-0"
                  />
                </UChip>
              </UButton>
            </UTooltip>

            <!-- Appearance -->
            <UTooltip
              text="Appearance"
              :shortcuts="['C']"
            >
              <UColorModeButton />
            </UTooltip>

            <!-- Current user menu -->
            <UserMenu />
          </template>
        </UDashboardNavbar>
        <UDashboardToolbar v-if="!!panelLinks.length">
          <UNavigationMenu
            :items="panelLinks"
            highlight
            class="-mx-1 flex-1"
          />
        </UDashboardToolbar>
      </template>
      <template #body>
        <slot />
      </template>
    </UDashboardPanel>
    <NotificationsSlideover />
    <UDashboardSearch
      v-model:open="isSearchOpen"
      :groups="groups"
    />
  </UDashboardGroup>
</template>
