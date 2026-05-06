<script setup lang="ts">
import type {
  TColumn,
  TFilter,
  TField,
  TGetActions,
  TBaseCrudModal,
} from '@/components/base/BaseCrud.vue'

const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

const { getAttachment } = useGetAttachment()

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name',
  },
  {
    name: 'email',
    type: 'input',
    label: 'Email',
    props: {
      type: 'email',
    },
  },
  {
    name: 'password',
    type: 'input',
    label: 'Password',
    props: {
      type: 'password',
    },
  },
  {
    name: 'roles',
    type: 'autocomplete',
    label: 'Roles',
    props: {
      api: '/api/roles',
      query: {
        options: true,
      },
    },
  },
]

const columns = computed<TColumn<TUser>[]>(() => [
  {
    id: 'select',
    size: 48,
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48,
  },
  {
    accessorKey: 'name',
    header: 'Name',
    sortBy: 'name',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UAvatar, {
          size: 'sm',
          src: getAttachment(row.original.avatarId),
          alt: row.original.name,
        }),
        h('div', {}, row.original.name),
      ])
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    sortBy: 'email',
    display: {
      type: 'text',
      class: 'min-w-48',
      length: 36,
    },
    cell({ row }) {
      return row.original.email || '—'
    },
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1',
    },
    cell({ row, ...ctx }) {
      if (!row.original.userRoles?.length) return '—'
      return row.original.userRoles
        .map((ur) => ur.role?.name as string)
        .filter(Boolean)
        .map((label) => {
          const modal = (ctx as any).modal
          return h(UBadge, {
            label,
            size: modal ? 'lg' : 'md',
            class: modal ? 'ml-1 mt-1' : 'mr-1',
            color: ColorsMap[label] || 'neutral',
            variant: 'subtle',
          })
        })
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt),
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt),
  },
  {
    id: 'action',
    pinned: 'right',
  },
])

const filters: TFilter[] = [
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10',
    },
  },
  {
    name: 'name',
    type: 'input',
    props: {
      label: 'Name',
      placeholder: 'Search by name',
      modeable: true,
    },
  },
  {
    name: 'email',
    type: 'input',
    props: {
      label: 'Email',
      placeholder: 'Search by email',
      modeable: true,
    },
  },
  {
    name: 'roleIds',
    type: 'checkbox-api',
    props: {
      label: 'Roles',
      api: '/api/roles',
      query: {
        options: true,
      },
    },
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created',
    },
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated',
    },
  },
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New User' : 'Update User',
    description: mode === 'create' ? 'Create a user account' : 'Update user details',
  }),
}

const getActions: TGetActions<TUser> = (item, v) => [
  [
    {
      ...actions.view,
      hidden: v?.view,
      onSelect() {
        crudRef.value?.onView(item, {
          modal: {
            ui: {
              content: 'max-w-2xl',
            },
          },
        })
      },
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      },
    },
  ].filter((action: any) => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(`/api/users/${item.id}`)
      },
    },
  ],
]

const getFormState = (v?: TUser) => ({
  id: v?.id,
  name: v?.name ?? '',
  email: v?.email ?? '',
  password: '',
  roles: v?.userRoles?.map((ur) => ur.role).filter(Boolean) ?? [],
})

const getPostBody = (v: Record<string, any>) => {
  const body: Record<string, unknown> = {
    id: v.id,
    name: v.name,
    email: v.email,
    roleIds: (v.roles ?? []).map((r: any) => r.id),
  }
  const pwd = typeof v.password === 'string' ? v.password.trim() : ''
  if (pwd) body.password = pwd
  return body
}

const onDeleteSelected = () => {
  crudRef.value?.onDeleteSelected((rows) => {
    return `/api/users/${rows.map((x) => x.id).join(',')}`
  })
}
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/users"
    post-url="/api/users"
    export-url="/api/users/export"
    persist-key="users"
    :fields="fields"
    :columns="columns"
    :filters="filters"
    :modal="modal"
    :date-fields="['createdAt', 'updatedAt']"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  >
    <template #bulk-actions="{ count }">
      <UButton
        label="Delete"
        color="error"
        variant="subtle"
        icon="i-lucide-trash"
        :ui="{ leadingIcon: 'size-4' }"
        @click="onDeleteSelected"
      >
        <template #trailing>
          <UKbd>
            {{ count }}
          </UKbd>
        </template>
      </UButton>
    </template>
  </BaseCrud>
</template>
