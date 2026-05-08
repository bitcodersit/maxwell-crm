<script setup lang="ts">
import type {
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'

const toastP = usePromiseToast()
const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')
const UIcon = resolveComponent('UIcon')
const UTooltip = resolveComponent('UTooltip')
const { confirm } = useConfirm()

const { getAttachment } = useGetAttachment()

const fields: TField[] = [
  {
    name: 'name',
    type: 'input',
    label: 'Name'
  },
  {
    name: 'email',
    type: 'input',
    label: 'Email',
    props: {
      type: 'email'
    }
  },
  {
    name: 'password',
    type: 'input',
    label: 'Password',
    props: {
      type: 'password'
    }
  },
  {
    name: 'roleIds',
    type: 'autocomplete',
    label: 'Roles',
    props: {
      api: '/api/roles',
      query: {
        options: true,
        excludeCustomer: true
      }
    }
  }
]

const columns = computed<TColumn<TUser>[]>(() => [
  {
    id: 'select',
    size: 48
  },
  {
    accessorKey: 'id',
    header: 'ID',
    pinned: 'left',
    sortBy: 'id',
    size: 48
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
          ui: {
            fallback: 'text-xs'
          }
        }),
        h('div', {}, row.original.name)
      ])
    }
  },
  {
    accessorKey: 'email',
    header: 'Email',
    sortBy: 'email',
    display: {
      type: 'text',
      class: 'min-w-48',
      length: 36
    },
    cell({ row }) {
      const verified = !!row.original.emailVerifiedAt
      const verifiedText = verified
        ? `Verified at ${$dfc(row.original.emailVerifiedAt)}`
        : 'Email not verified'
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.email || '—'),
        h(
          UTooltip,
          { text: verifiedText },
          {
            default: () =>
              h(UIcon, {
                name: verified ? 'i-lucide-circle-check' : 'i-lucide-circle-alert',
                class: verified ? 'text-success size-4' : 'text-warning size-4'
              })
          }
        )
      ])
    }
  },
  {
    accessorKey: 'roles',
    header: 'Roles',
    display: {
      type: 'array',
      slice: 3,
      class: 'flex flex-wrap -ml-1 -mt-1'
    },
    cell({ row, ...ctx }) {
      if (!row.original.userRoles?.length) return '—'
      return row.original.userRoles
        .map(ur => ur.role?.name as string)
        .filter(Boolean)
        .map((label) => {
          const modal = Boolean((ctx as { modal?: boolean }).modal)
          return h(UBadge, {
            label,
            size: modal ? 'lg' : 'md',
            class: modal ? 'ml-1 mt-1' : 'mr-1',
            color: ColorsMap[label] || 'neutral',
            variant: 'subtle'
          })
        })
    }
  },
  {
    accessorKey: 'createdAt',
    header: 'Created',
    sortBy: 'createdAt',
    cell: ({ row }) => $dfc(row.original.createdAt)
  },
  {
    accessorKey: 'updatedAt',
    header: 'Updated',
    sortBy: 'updatedAt',
    cell: ({ row }) => $dfc(row.original.updatedAt)
  },
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters: TFilter[] = [
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10'
    }
  },
  {
    name: 'name',
    type: 'input',
    props: {
      label: 'Name',
      placeholder: 'Search by name',
      modeable: true
    }
  },
  {
    name: 'email',
    type: 'input',
    props: {
      label: 'Email',
      placeholder: 'Search by email',
      modeable: true
    }
  },
  {
    name: 'roleIds',
    type: 'checkbox-api',
    props: {
      label: 'Roles',
      api: '/api/roles',
      query: {
        options: true,
        excludeCustomer: true
      }
    }
  },
  {
    name: 'createdAt',
    type: 'date',
    props: {
      label: 'Created'
    }
  },
  {
    name: 'updatedAt',
    type: 'date',
    props: {
      label: 'Updated'
    }
  }
]

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New User' : 'Update User',
    description: mode === 'create' ? 'Create a user account' : 'Update user details'
  })
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
              content: 'max-w-2xl'
            }
          }
        })
      }
    },
    {
      ...actions.update,
      onSelect() {
        crudRef.value?.onUpdate(item)
      }
    },
    {
      label: 'Send verify email',
      icon: 'i-lucide-mail-check',
      hidden: !!item.emailVerifiedAt,
      async onSelect() {
        if (!(await confirm(`Send verification email to "${item.email}"?`))) {
          return
        }
        toastP(
          (toast) => {
            return $fetch(`/api/users/${item.id}/verify-email`, {
              method: 'POST'
            })
              .then(toast.onSuccess)
              .catch(toast.onError)
          },
          {
            title: 'Sending verification email...',
            description: `Sending to ${item.email}`
          },
          res => ({
            title: 'Verification email sent',
            description: res?.message || 'Verification email sent successfully'
          }),
          (err) => {
            const { message } = parseError(err)
            return {
              title: 'Failed to send email',
              description: message
            }
          }
        )
      }
    }
  ].filter(action => !action.hidden),
  [
    {
      ...actions.delete,
      onSelect() {
        crudRef.value?.onDelete(item)
      }
    }
  ]
]

const getFormState = (v?: TUser) => ({
  id: v?.id,
  name: v?.name ?? '',
  email: v?.email ?? '',
  password: '',
  roleIds: v?.userRoles?.map(ur => ur.role).filter(Boolean) ?? []
})

const getPostBody = (v: Record<string, unknown>) => {
  const roleIds = Array.isArray(v.roleIds)
    ? v.roleIds.map(role => (role as { id?: number })?.id).filter(id => typeof id === 'number')
    : []
  const body: Record<string, unknown> = {
    id: v.id,
    name: v.name,
    email: v.email,
    roleIds
  }
  const pwd = typeof v.password === 'string' ? v.password.trim() : ''
  if (pwd) body.password = pwd
  return body
}
</script>

<template>
  <BaseCrud
    ref="crudRef"
    get-url="/api/users"
    post-url="/api/users"
    export-url="/api/users/export"
    delete-url="/api/users/{id}"
    :modal="modal"
    :fields="fields"
    :filters="filters"
    :columns="columns"
    :date-fields="['createdAt', 'updatedAt']"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
  />
</template>
