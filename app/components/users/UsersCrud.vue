<script setup lang="ts">
import type {
  TBaseCrudImport,
  TBaseCrudModal,
  TColumn,
  TField,
  TFilter,
  TGetActions
} from '@/components/base/BaseCrud.vue'

const props = defineProps<{
  trashed?: boolean
}>()

const toastP = usePromiseToast()
const crudRef = useTemplateRef('crudRef')
const UBadge = resolveComponent('UBadge')
const UAvatar = resolveComponent('UAvatar')

const { user } = useCurrentUser()
const { hCopy } = useHCopy()
const { confirm } = useConfirm()
const { getAttachment } = useGetAttachment()

const canManageTrash = computed(() => !!props.trashed && !!user.value?.deleteAnyUsers)

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
          src: getAttachment(row.original.avatar?.path),
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
    cell({ row }) {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('span', row.original.email || '—'),
        hVerified(row.original.email, row.original.emailVerifiedAt, 'Email not verified'),
        hCopy(row.original.email)
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
        .map(label => {
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
    accessorKey: 'creator',
    header: 'Creator',
    cell: ({ row }) => row.original.creator?.name || '—'
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
  ...(props.trashed
    ? [
        {
          accessorKey: 'deletedAt',
          header: 'Deleted',
          sortBy: 'deletedAt',
          cell: ({ row }: { row: { original: TUser } }) => $dfc(row.original.deletedAt)
        } satisfies TColumn<TUser>
      ]
    : []),
  {
    id: 'action',
    pinned: 'right'
  }
])

const filters = computed<TFilter[]>(() => [
  {
    name: 'q',
    type: 'inline-input',
    props: {
      placeholder: 'Search...'
    }
  },
  {
    name: 'id',
    type: 'input',
    props: {
      label: 'ID',
      placeholder: 'eg 1 or 1,2,3 or 1-10'
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
  ...(props.trashed
    ? [
        {
          name: 'deletedAt',
          type: 'date' as const,
          props: {
            label: 'Deleted'
          }
        } satisfies TFilter
      ]
    : []),
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
])

const modal: TBaseCrudModal = {
  form: ({ mode }) => ({
    title: mode === 'create' ? 'Add New User' : 'Update User',
    description: mode === 'create' ? 'Create a user account' : 'Update user details'
  })
}

const getActions: TGetActions<TUser> = (item, v) => {
  const viewGroup = [
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
    ...(props.trashed
      ? []
      : [
          {
            ...actions.update,
            hidden: false,
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
                toast => {
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
                err => {
                  const { message } = parseError(err)
                  return {
                    title: 'Failed to send email',
                    description: message
                  }
                }
              )
            }
          }
        ])
  ].filter(action => !action.hidden)

  const restoreGroup =
    props.trashed && canManageTrash.value
      ? [
          {
            ...actions.restore,
            onSelect() {
              crudRef.value?.onRestore(item)
            }
          }
        ]
      : []

  const dangerGroup = props.trashed
    ? canManageTrash.value
      ? [
          {
            ...actions.deleteForever,
            onSelect() {
              crudRef.value?.onDelete(item)
            }
          }
        ]
      : []
    : [
        {
          ...actions.delete,
          onSelect() {
            crudRef.value?.onDelete(item)
          }
        }
      ]

  return [viewGroup, restoreGroup, dangerGroup].filter(group => group.length)
}

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

const importConfig: TBaseCrudImport = {
  importUrl: '/api/users/import',
  exampleUrl: '/api/users/import/example',
  title: 'Bulk Import Users',
  description: 'Upload a CSV or Excel file to create multiple users at once',
  entityLabel: 'user',
  dropzoneDescription: 'CSV or Excel (.xlsx, .xls) — roles by name or id (comma-separated)',
  failedColumns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Roles' }
  ]
}

const dateFields = computed(() =>
  props.trashed ? ['createdAt', 'updatedAt', 'deletedAt'] : ['createdAt', 'updatedAt']
)

const initialQuery = computed(() =>
  props.trashed
    ? {
        orderBy: {
          deletedAt: 'desc' as const
        }
      }
    : undefined
)
</script>

<template>
  <BaseCrud
    ref="crudRef"
    :get-url="trashed ? '/api/trash/users' : '/api/users'"
    :post-url="trashed ? undefined : '/api/users'"
    :export-url="trashed ? undefined : '/api/users/export'"
    :delete-url="
      trashed ? (canManageTrash ? '/api/trash/users/{id}' : undefined) : '/api/users/{id}'
    "
    :restore-url="canManageTrash ? '/api/trash/users/{id}/restore' : undefined"
    :permanent-delete="trashed"
    :show-add-button="!trashed"
    :modal="trashed ? undefined : modal"
    :fields="trashed ? [] : fields"
    :filters="filters"
    :columns="columns"
    :date-fields="dateFields"
    :initial-query="initialQuery"
    :get-actions="getActions"
    :get-post-body="getPostBody"
    :get-form-state="getFormState"
    :import-config="trashed ? undefined : importConfig"
  />
</template>
