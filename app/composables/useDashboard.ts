import type { NavigationMenuItem } from '@nuxt/ui'

const _useDashboard = () => {
  const route = useRoute()
  const router = useRouter()

  const isSearchOpen = ref(false)
  const isNotificationsOpen = ref(false)

  const title = ref('')
  const links = ref<NavigationMenuItem[][]>([])

  defineShortcuts({
    'g-h': () => router.push('/'),
    'g-i': () => router.push('/inbox'),
    'g-t': () => router.push('/tasks'),
    'g-c': () => router.push('/customers'),
    'g-s': () => router.push('/settings'),
    'n': () => (isNotificationsOpen.value = !isNotificationsOpen.value)
  })

  watch(
    () => route.fullPath,
    (path) => {
      isNotificationsOpen.value = false
      const titleItem = titlesMap.find((item) => {
        return item.exact ? path === item.path : path.startsWith(item.path)
      })
      const linksItem = linksMap.find((item) => {
        return path.startsWith(item.path)
      })
      title.value = titleItem?.title ?? ''
      links.value = linksItem?.links ?? []
    },
    {
      immediate: true
    }
  )

  return {
    title,
    links,
    isSearchOpen,
    isNotificationsOpen
  }
}

export const useDashboard = createSharedComposable(_useDashboard)

const titlesMap = [
  {
    exact: true,
    path: '/',
    title: 'Home'
  },
  {
    path: '/tasks',
    title: 'Tasks'
  },
  {
    path: '/users',
    title: 'Users'
  },
  {
    path: '/teams',
    title: 'Teams'
  },
  {
    path: '/roles',
    title: 'Roles'
  },
  {
    path: '/permissions',
    title: 'Permissions'
  },
  {
    path: '/customers',
    title: 'Customers'
  },
  {
    exact: true,
    path: '/settings',
    title: 'Settings'
  },
  {
    path: '/settings/security',
    title: 'Security Settings'
  }
]

const linksMap = [
  {
    path: '/settings',
    links: [
      [
        {
          label: 'General',
          icon: 'i-lucide-user',
          to: '/settings',
          exact: true
        },

        {
          label: 'Security',
          icon: 'i-lucide-shield',
          to: '/settings/security'
        }
      ]
    ]
  }
]
